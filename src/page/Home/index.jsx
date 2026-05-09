import { useDocumentTitle } from "../../hooks/useDocumentTitle";

const Home = () => {
  useDocumentTitle("Dashboard");
  return (
    <h1>Iniciaste sesion</h1>
  )
}

export default Home