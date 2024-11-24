const { pool } = require('../db/init');

const paymentController = {
    async addPaymentMethod(req, res) {
        const { card_type, last_four, expiry_month, expiry_year } = req.body;
        const user_id = req.user.userId;

        try {
            const result = await pool.query(`
                INSERT INTO payment_methods 
                (user_id, card_type, last_four, expiry_month, expiry_year)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, card_type, last_four, expiry_month, expiry_year, is_default`,
                [user_id, card_type, last_four, expiry_month, expiry_year]
            );

            res.status(201).json({
                message: 'Payment method added successfully',
                payment_method: result.rows[0]
            });
        } catch (error) {
            console.error('Error adding payment method:', error);
            res.status(500).json({ error: 'Failed to add payment method' });
        }
    },

    async getPaymentMethods(req, res) {
        const user_id = req.user.userId;

        try {
            const result = await pool.query(`
                SELECT id, card_type, last_four, expiry_month, expiry_year, is_default 
                FROM payment_methods 
                WHERE user_id = $1 
                ORDER BY is_default DESC, created_at DESC`,
                [user_id]
            );

            res.json({
                payment_methods: result.rows
            });
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            res.status(500).json({ error: 'Failed to fetch payment methods' });
        }
    },

    async removePaymentMethod(req, res) {
        const { methodId } = req.params;
        const user_id = req.user.userId;

        try {
            const result = await pool.query(`
                DELETE FROM payment_methods 
                WHERE id = $1 AND user_id = $2
                RETURNING id`,
                [methodId, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Payment method not found' });
            }

            res.json({ message: 'Payment method removed successfully' });
        } catch (error) {
            console.error('Error removing payment method:', error);
            res.status(500).json({ error: 'Failed to remove payment method' });
        }
    },

    async setDefaultPaymentMethod(req, res) {
        const { methodId } = req.params;
        const user_id = req.user.userId;

        try {
            await pool.query('BEGIN');

            // Remove default status from all user's payment methods
            await pool.query(`
                UPDATE payment_methods 
                SET is_default = false 
                WHERE user_id = $1`,
                [user_id]
            );

            // Set new default
            const result = await pool.query(`
                UPDATE payment_methods 
                SET is_default = true 
                WHERE id = $1 AND user_id = $2
                RETURNING id, card_type, last_four, expiry_month, expiry_year, is_default`,
                [methodId, user_id]
            );

            if (result.rows.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({ error: 'Payment method not found' });
            }

            await pool.query('COMMIT');

            res.json({
                message: 'Default payment method updated',
                payment_method: result.rows[0]
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error updating default payment method:', error);
            res.status(500).json({ error: 'Failed to update default payment method' });
        }
    },

    // Bank Account Methods
    async addBankAccount(req, res) {
        const { account_holder_name, last_four, routing_number } = req.body;
        const user_id = req.user.userId;

        try {
            const result = await pool.query(`
                INSERT INTO bank_accounts 
                (user_id, account_holder_name, last_four, routing_number)
                VALUES ($1, $2, $3, $4)
                RETURNING id, account_holder_name, last_four, routing_number, is_default`,
                [user_id, account_holder_name, last_four, routing_number]
            );

            res.status(201).json({
                message: 'Bank account added successfully',
                bank_account: result.rows[0]
            });
        } catch (error) {
            console.error('Error adding bank account:', error);
            res.status(500).json({ error: 'Failed to add bank account' });
        }
    },

    async getBankAccounts(req, res) {
        const user_id = req.user.userId;

        try {
            const result = await pool.query(`
                SELECT id, account_holder_name, last_four, routing_number, is_default 
                FROM bank_accounts 
                WHERE user_id = $1 
                ORDER BY is_default DESC, created_at DESC`,
                [user_id]
            );

            res.json({
                bank_accounts: result.rows
            });
        } catch (error) {
            console.error('Error fetching bank accounts:', error);
            res.status(500).json({ error: 'Failed to fetch bank accounts' });
        }
    },

    async removeBankAccount(req, res) {
        const { accountId } = req.params;
        const user_id = req.user.userId;

        try {
            const result = await pool.query(`
                DELETE FROM bank_accounts 
                WHERE id = $1 AND user_id = $2
                RETURNING id`,
                [accountId, user_id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Bank account not found' });
            }

            res.json({ message: 'Bank account removed successfully' });
        } catch (error) {
            console.error('Error removing bank account:', error);
            res.status(500).json({ error: 'Failed to remove bank account' });
        }
    },

    async setDefaultBankAccount(req, res) {
        const { accountId } = req.params;
        const user_id = req.user.userId;

        try {
            await pool.query('BEGIN');

            await pool.query(`
                UPDATE bank_accounts 
                SET is_default = false 
                WHERE user_id = $1`,
                [user_id]
            );

            const result = await pool.query(`
                UPDATE bank_accounts 
                SET is_default = true 
                WHERE id = $1 AND user_id = $2
                RETURNING id, account_holder_name, last_four, routing_number, is_default`,
                [accountId, user_id]
            );

            if (result.rows.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({ error: 'Bank account not found' });
            }

            await pool.query('COMMIT');

            res.json({
                message: 'Default bank account updated',
                bank_account: result.rows[0]
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error updating default bank account:', error);
            res.status(500).json({ error: 'Failed to update default bank account' });
        }
    }
};

module.exports = paymentController;