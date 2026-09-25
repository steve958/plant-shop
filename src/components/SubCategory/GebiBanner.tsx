import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import { shopContact } from "../../data/shopContact";
import gebiLogo from "../../assets/gebi/gebi-logo.png";
import energofeedBag from "../../assets/gebi/energofeed.png";
import energonBag from "../../assets/gebi/energon-kunici.png";
import "./GebiBanner.css";

/** Shown instead of the product grid for "Hrana za domaće životinje", sold only in store or by phone. */
export default function GebiBanner() {
    return (
        <section className="gebi-banner" aria-labelledby="gebi-banner-title">
            <div className="gebi-banner__copy">
                <div className="gebi-banner__partner">
                    <img src={gebiLogo} alt="Gebi" width={80} height={50} />
                    <span>U saradnji sa kompanijom Gebi</span>
                </div>
                <h2 id="gebi-banner-title">Kompletan program ishrane domaćih životinja</h2>
                <p>
                    U saradnji sa kompanijom Gebi u našoj ponudi možete pronaći kompletan program za ishranu svih
                    vrsta domaćih životinja. Prodaju vršimo isključivo kroz naš maloprodajni objekat i dogovorene
                    isporuke pozivom na naš broj telefona <strong>060 40 555 10</strong>.
                </p>
                <div className="gebi-banner__actions">
                    <a className="gebi-banner__call" href={shopContact.phoneHref}>
                        <PhoneInTalkOutlinedIcon aria-hidden="true" /> Pozovite 060 40 555 10
                    </a>
                    <span className="gebi-banner__store">
                        <StorefrontOutlinedIcon aria-hidden="true" /> Vojvode Janka Stojićevića 22, Šabac
                    </span>
                </div>
            </div>
            <div className="gebi-banner__visual" aria-hidden="true">
                <img className="gebi-banner__bag gebi-banner__bag--main" src={energofeedBag} alt="" loading="lazy" decoding="async" />
                <img className="gebi-banner__bag gebi-banner__bag--side" src={energonBag} alt="" loading="lazy" decoding="async" />
            </div>
        </section>
    );
}
