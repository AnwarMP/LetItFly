import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const PrivateRoute = ({ children, roles = [] }) => {
    const { isAuthenticated, role } = useSelector((state) => state.auth);

    // Not logged in
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // Logged in but wrong role
    if (roles.length > 0 && !roles.includes(role)) {
        return <Navigate to="/" />;
    }

    // Authorized - return content
    return children;
};