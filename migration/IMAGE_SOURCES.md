# Izvori fotografija za migraciju

Postojeći katalog sadrži 211 proizvoda i 220 URL-ova fotografija. Svi URL-ovi trenutno vraćaju HTTP 402 iz starog Firebase Storage projekta, zato ih importer prvo proverava, a zatim koristi jednu od licenciranih kategorijskih fotografija iz `category-image-sources.json` kada original nije dostupan.

Kategorijske fotografije služe kao bezbedna privremena zamena, ne kao fotografija konkretnog preparata ili uređaja. Administrator treba vremenom da ih zameni tačnim fotografijama pakovanja kroz panel. Izvor, autor i licenca su sačuvani u manifestu radi atribucije.

Ne treba automatski uzimati rezultate Google Images ili hotlinkovati slike proizvođača bez potvrde prava korišćenja.
