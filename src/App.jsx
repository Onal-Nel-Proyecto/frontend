import "@tabler/icons-webfont/dist/tabler-icons.min.css"; // ← agrega esta línea
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./page/login";
import ClientDirectory from "./page/ClientDirectory";
// import RegisterClient   from "./page/RegisterClient";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Login />} />
        <Route path="/clients"        element={<ClientDirectory />} />
        {/* <Route path="/register-client" element={<RegisterClient />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;