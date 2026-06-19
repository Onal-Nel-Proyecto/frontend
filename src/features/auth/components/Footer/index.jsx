import styles from "./ftr.module.css";

const Footer = () => {
  return (
    <div className={styles.loginFooter}>

      <p>
        ¿No tienes una cuenta?
        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=deliorafaelcantillovilla@gmail.com" target="_blank" rel="noopener noreferrer"> Contactar a soporte</a>
      </p>

    </div>
  );
};
  
export default Footer;