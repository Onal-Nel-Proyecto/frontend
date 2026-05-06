import styles from './ftr.module.css';

const Footer = () => {
  return (
    <div className={styles.loginFooter}>
      <p>
        ¿No tienes una cuenta?
        <a href="#"> Contactar a soporte</a>
      </p>
    </div>
  );
};

export default Footer;