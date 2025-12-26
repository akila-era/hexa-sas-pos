import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@tabler/icons-webfont/tabler-icons.min.css";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./assets/css/feather.css";
import "./assets/css/style.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./customStyle.scss";
import "./assets/icons/boxicons/css/boxicons.min.css";
import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

