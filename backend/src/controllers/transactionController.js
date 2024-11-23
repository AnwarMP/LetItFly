const { pool } = require('../db/init');

const transactionController = {
    async getTransactionHistory(req, res) {
        const user_id = req.user.userId;
        const role = req.user.role;
        const { startDate, endDate } = req.query;

        try {
            let query = `
                SELECT t.*,
                    r.pickup_location,
                    r.dropoff_location,
                    r.ride_status,
                    u1.first_name as rider_name,
                    u2.first_name as driver_name,
                    pm.card_type,
                    pm.last_four as card_last_four,
                    ba.last_four as bank_last_four
                FROM transactions t
                JOIN rides r ON t.ride_id = r.id
                JOIN users u1 ON t.rider_id = u1.id
                JOIN users u2 ON t.driver_id = u2.id
                LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
                LEFT JOIN bank_accounts ba ON t.bank_account_id = ba.id
                WHERE t.${role === 'rider' ? 'rider_id' : 'driver_id'} = $1
            `;

            const queryParams = [user_id];
            let paramCount = 1;

            if (startDate) {
                paramCount++;
                query += ` AND t.created_at >= $${paramCount}`;
                queryParams.push(startDate);
            }

            if (endDate) {
                paramCount++;
                query += ` AND t.created_at <= $${paramCount}`;
                queryParams.push(endDate);
            }

            query += ` ORDER BY t.created_at DESC`;

            const result = await pool.query(query, queryParams);

            res.json({
                transactions: result.rows
            });
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            res.status(500).json({ error: 'Failed to fetch transaction history' });
        }
    },

    async getTransactionDetails(req, res) {
        const { transactionId } = req.params;
        const user_id = req.user.userId;

        try {
            const result = await pool.query(`
                SELECT t.*,
                    r.pickup_location,
                    r.dropoff_location,
                    r.ride_status,
                    u1.first_name as rider_name,
                    u2.first_name as driver_name,
                    pm.card_type,
                    pm.last_four as card_last_four,
                    ba.last_four as bank_last_four
                FROM transactions t
                JOIN rides r ON t.ride_id = r.id
                JOIN users u1 ON t.rider_id = u1.id
                JOIN users u2 ON t.driver_id = u2.id
                LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
                LEFT JOIN bank_accounts ba ON t.bank_account_id = ba.id
                WHERE t.id = $1 AND (t.rider_id = $2 OR t.driver_id = $2)`,
                [transactionId, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            res.json({
                transaction: result.rows[0]
            });
        } catch (error) {
            console.error('Error fetching transaction details:', error);
            res.status(500).json({ error: 'Failed to fetch transaction details' });
        }
    },

    async getEarningsSummary(req, res) {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ error: 'Only drivers can access earnings summary' });
        }

        const driver_id = req.user.userId;
        const { period } = req.query; // 'day', 'week', 'month', 'year'

        try {
            let timeFilter;
            switch (period) {
                case 'day':
                    timeFilter = "DATE_TRUNC('day', created_at) = CURRENT_DATE";
                    break;
                case 'week':
                    timeFilter = "DATE_TRUNC('week', created_at) = DATE_TRUNC('week', CURRENT_DATE)";
                    break;
                case 'month':
                    timeFilter = "DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)";
                    break;
                case 'year':
                    timeFilter = "DATE_TRUNC('year', created_at) = DATE_TRUNC('year', CURRENT_DATE)";
                    break;
                default:
                    timeFilter = "TRUE";
            }

            const result = await pool.query(`
                SELECT 
                    COUNT(*) as total_rides,
                    SUM(amount) as total_earnings,
                    AVG(amount) as average_ride,
                    MIN(amount) as min_ride,
                    MAX(amount) as max_ride
                FROM transactions
                WHERE driver_id = $1
                AND ${timeFilter}`,
                [driver_id]
            );

            res.json({
                summary: result.rows[0]
            });
        } catch (error) {
            console.error('Error fetching earnings summary:', error);
            res.status(500).json({ error: 'Failed to fetch earnings summary' });
        }
    }
};

module.exports = transactionController;