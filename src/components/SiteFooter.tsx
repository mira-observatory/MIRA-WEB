import { useCopy } from "../i18n";

type SiteFooterProps = {
  /**
   * Reserva la esquina inferior derecha para el boton flotante de "Ver consulta".
   * Sin esto el boton tapa el texto del pie cuando se llega al final de la pagina.
   */
  reserveFloatingAction?: boolean;
};

export function SiteFooter({ reserveFloatingAction = false }: SiteFooterProps) {
  const copy = useCopy();
  return (
    <footer className={`site-footer ${reserveFloatingAction ? "with-floating-action" : ""}`}>
      <div className="footer-content">
        <div className="footer-logos">
          <img
            src="/images/url_logo.png"
            alt="Universidad Rafael Landivar"
            className="footer-logo url-logo"
          />
          <img
            src="/images/carter_center_logo.png"
            alt="The Carter Center"
            className="footer-logo carter-logo"
          />
        </div>
        <div className="footer-text">
          <span>
            <strong>{copy.brand.name}</strong> — {copy.home.footer.product}
          </span>
          <span>{copy.home.footer.initiative}</span>
        </div>
      </div>
    </footer>
  );
}
