import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
    return (
        <nav className="main-navigation">
        <Link to="/" className="nav-link">RSA Calculator</Link>
        <Link to="/visualizations" className="nav-link">Visualizations</Link>
        </nav>
    );
};

export default Navigation;
