import Header from "../components/Header";
import Formulario from "../components/Formulario";
import Footer from "../components/Footer";
import "./login.css";

const Login = () => {
  return (
    <div className="login-container">
      <div className="login-card">
        <Header />
        <Formulario />
        <Footer />
        <div className="decorative-needle">🪡</div>
      </div>
    </div>
  );
};

export default Login;