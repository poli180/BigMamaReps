# BigMamaReps

Deutschsprachiger Fashion-Shop mit Next.js App Router, React, Tailwind CSS, Framer Motion, PostgreSQL/Prisma und Stripe Checkout. Shop und API laufen gemeinsam als Next.js-Anwendung; es ist kein separates Frontend-Deployment erforderlich.

## Enthalten

- Responsive Startseite, Produktkatalog, Kategorien, Filter, Sortierung, Sale-Seite, Produktgalerie/Zoom, Farb-/Größenwahl und persistenter Warenkorb mit Drawer.
- Zentral berechnete, zeitgesteuerte Sale-Preise; Featured unabhängig von Sale; Gruppenaktionen im Admin.
- Eigener Admin-Login ohne öffentliche Registrierung, bcrypt-Hash, signierte achtstündige Sitzung, HttpOnly-/SameSite-Cookie, Secure-Cookie in Produktion, Proxy- und zusätzliche serverseitige Autorisierungsprüfungen.
- Dashboard, Bestellübersicht und Details, Zahlungs-/Versandstatus, Notizen, Tracking, Kundenliste und Bestellhistorie.
- Produkteditor mit Variantenmatrix, Bestand je Variante, Medien je Farbe, Mehrfach- und Drag-and-drop-Upload, Bildreihenfolge und Aktivierung/Deaktivierung.
- CMS für Hero-Bild/Video/Platzhalter, Texte, Banner, Logo, Farben, Footer, Social Links und rechtliche Seiten.
- Stripe Checkout, signierte Webhooks, asynchrone Zahlungsmethoden, vollständige/teilweise Erstattungen, Lagerreservierungen, idempotente Bestellverarbeitung, fortlaufende Bestellnummern.
- Resend-E-Mail-Outbox für Kunde und Betreiber, optional Telegram, Versandbenachrichtigung, authentifizierter Cron-Abgleich.

## Schnellstart

Voraussetzungen: Node.js **22 LTS**, npm und PostgreSQL 16 oder neuer. Prisma 6 ist bewusst fest gepinnt; Schema und Migrationen gehören zusammen.

```bash
git clone https://github.com/poli180/BigMamaReps.git
cd BigMamaReps
npm install
cp .env.example .env
```

Unter Windows PowerShell statt `cp`: `Copy-Item .env.example .env`.

Für eine **reine Shop-Vorschau** kann `DATABASE_URL` leer bleiben: `npm run dev`. Sie zeigt markierte Beispielprodukte; Checkout und Admin-Schreibzugriff sind deaktiviert. Öffnen: `http://127.0.0.1:3000`.

Für den vollständigen Shop PostgreSQL konfigurieren. Optional lokal mit Docker:

```bash
docker compose up -d
```

Für die mitgelieferte lokale Datenbank lautet die URL `postgresql://shop:local-development-only@127.0.0.1:5432/bigmamareps`. Dieses Entwicklungskennwort niemals in Produktion verwenden.

In `.env` mindestens `DATABASE_URL`, `APP_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL` und `ADMIN_PASSWORD_HASH` setzen. `APP_URL` muss exakt der Browser-Adresse entsprechen, z. B. `http://127.0.0.1:3000` (nicht gleichzeitig localhost verwenden).

```bash
# Zufälliges Session-Secret erzeugen und in NEXTAUTH_SECRET eintragen:
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
# Passwort verdeckt eingeben; Ausgabe als ADMIN_PASSWORD_HASH übernehmen:
npm run admin:hash
npm run db:migrate
# Optional: Beispielkatalog anlegen (idempotent, überschreibt keine Produkte):
npm run db:seed
npm run dev
```

Admin unter `/admin/login`. Passwort: mindestens 14 Zeichen und höchstens 72 UTF-8-Bytes. `NEXTAUTH_SECRET` mindestens 32 Zeichen. Secret-Wechsel macht bestehende Sitzungen ungültig. Es gibt kein voreingestelltes Admin-Passwort.

`npm install` wird unterstützt; die festgehaltene Dependency-Auflösung liegt in `pnpm-lock.yaml`. Für dieselbe Auflösung wie CI: `npm install -g pnpm@11.25.0`, danach `pnpm install --frozen-lockfile`.

## Umgebungsvariablen

| Variable                                               | Zweck                                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                                         | PostgreSQL-Verbindung; bei Serverless Betrieb Pooling passend zum Anbieter konfigurieren               |
| `APP_URL`                                              | Öffentliche HTTPS-Origin ohne abschließenden Slash; lokal exakt die verwendete Origin                  |
| `NEXTAUTH_SECRET`                                      | Eigener JWT-Secret (Name zur Vorgabenkompatibilität; NextAuth selbst ist nicht installiert)            |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`                   | Ein zugelassener Admin, bcrypt-Hash                                                                    |
| `STRIPE_SECRET_KEY`                                    | Serverseitiger Stripe-Schlüssel; möglichst eingeschränkter Schlüssel mit den benötigten Berechtigungen |
| `STRIPE_WEBHOOK_SECRET`                                | Signing Secret des jeweiligen Webhook-Endpunkts                                                        |
| `STRIPE_PUBLISHABLE_KEY`                               | Reserviert; gehosteter Checkout benötigt derzeit keinen Browser-Schlüssel                              |
| `EMAIL_API_KEY`, `EMAIL_FROM`                          | Resend-Schlüssel und verifizierte Absenderadresse                                                      |
| `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`             | Schreibzugang zu einem S3-kompatiblen Medien-Bucket                                                    |
| `STORAGE_BUCKET`, `STORAGE_ENDPOINT`, `STORAGE_REGION` | Bucket, API-Endpunkt und Region; bei AWS Standard-Endpunkt `STORAGE_ENDPOINT` leer lassen              |
| `STORAGE_BUCKET_URL`                                   | Öffentliche HTTPS-CDN-/Bucket-Basis-URL ohne abschließenden Slash                                      |
| `CRON_SECRET`                                          | Zufälliges Secret zum Authentifizieren des Wartungsendpunkts                                           |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`               | Optionaler Betreiber-Kanal, zusätzlich im Admin aktivieren                                             |

Echte Secrets gehören ausschließlich in `.env` beziehungsweise den Secret Store des Hosters, nie ins Repository. Für Vercel vertrauliche Umgebungsvariablen verwenden. Demo-, Stripe-Test- und Produktivumgebungen getrennt halten.

## Stripe einrichten und testen

1. Eigene Stripe-Testumgebung verwenden und die beiden serverseitigen Schlüssel konfigurieren.
2. Endpoint `https://DEINE-DOMAIN/api/webhooks/stripe` mit folgenden Ereignissen verbinden:
   - `checkout.session.completed`, `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`, `checkout.session.expired`
   - `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
3. Gewünschte Zahlungsarten im Stripe-Dashboard aktivieren. Die Anwendung schränkt sie nicht auf Kartenzahlung ein.
4. Lokal optional `stripe listen --forward-to http://127.0.0.1:3000/api/webhooks/stripe`; das hierbei angezeigte Signing Secret verwenden.
5. Testbestellung, fehlgeschlagene Zahlung, verzögerte Zahlungsmethode, doppelte Webhooks und Erstattung mit deinem Stripe-Konto durchspielen. Automatische Tests verwenden einen Stripe-Stub; sie ersetzen keinen echten Integrationstest mit deinen Schlüsseln.

Preis, aktiver Sale, Variantenstatus, Lagerbestand und Versand kommen ausschließlich vom Server. Eine Bestellung reserviert Bestand vor Checkout; `stock` wird erst nach bestätigter Zahlung reduziert. Offene Sessions laufen nach 35 Minuten ab. Erst Stripe-bestätigtes Ablaufen gibt Reservierungen frei. Bei unklarer Netzwerkantwort bleiben Reservierungen sicherheitshalber bestehen, bis der Cron-Abgleich die Session gefunden hat. Ungeklärte Fälle erscheinen im Dashboard und müssen mit Stripe abgeglichen werden. Niemals Reservierungen nur aufgrund einer lokalen Uhr freigeben, während eine Zahlung noch laufen könnte.

Bestellnummern folgen `BMR-JAHR-000123`; die Sequenz ist global fortlaufend und darf durch fehlgeschlagene Transaktionen Lücken enthalten. Erstattungen erhöhen Bestand nicht automatisch, da Waren physisch zurückkehren müssen. Teil-Erstattungen werden als Betrag angezeigt; vollständig erstattete Bestellungen tragen `REFUNDED`.

## Medien

Bucket-CORS muss `PUT` von deiner `APP_URL`, den Header `Content-Type` und lesbare Medien-URLs erlauben. Empfohlene CORS-Regel, Domain ersetzen:

```json
[
  {
    "AllowedOrigins": ["https://DEINE-DOMAIN"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Uploads sind auf JPG/PNG/WebP (10 MB) sowie MP4/WebM (100 MB) begrenzt. SVG/HTML-Uploads sind ausgeschlossen. Signierte Upload-URLs gelten zehn Minuten. Der Store/CDN muss öffentliche Leserechte auf den Medienpfad haben, keine öffentlichen Schreibrechte. `STORAGE_BUCKET_URL` wird zur Build-Zeit für Next Image freigegeben; nach Änderung erneut bauen. Weitere externe Bildhosts müssen ausdrücklich in `next.config.ts` freigegeben werden.

Video: `autoplay muted loop playsinline`, `preload="metadata"` und optionales Poster. Keine automatische Transkodierung/Streaming-Pipeline: Videos vor Upload optimieren, beispielsweise als kompaktes H.264 MP4 mit Faststart. Ohne hochgeladenes Medium erscheint der animierte Platzhalter. Das Beispielmaterial von Unsplash dient ausschließlich der gekennzeichneten Vorschau; eigene Produktfotos und verifizierte Produktangaben vor Verkauf einsetzen.

## Benachrichtigungen und Wartung

Resend-Absender verifizieren, `EMAIL_*` setzen. E-Mails werden transaktional in eine Outbox eingereiht und nach Webhook sowie durch den Cronjob versendet. Bei Fehlern erfolgen bis zu 20 Versuche; offene Benachrichtigungen stehen im Dashboard. Resend erhält eine stabile Idempotenz-ID. Die Zustellung ist grundsätzlich mindestens einmal; bei langen Netzwerkausfällen oder Telegram sind Duplikate möglich.

Den folgenden Endpunkt alle fünf Minuten durch einen externen Scheduler/Hosting-Cronjob aufrufen:

```http
GET /api/cron
Authorization: Bearer <CRON_SECRET>
```

Dieser gleicht abgelaufene Reservierungen mit Stripe ab und verarbeitet die Outbox. Die tatsächliche Einrichtung eines Schedulers ist Teil des Deployments; das Repository erstellt keinen kostenpflichtigen Zeitplan. Fehlermeldungen und `unresolvedReservations` überwachen. Versandwechsel auf „Versendet“ reiht eine Kundenmail mit Trackingnummer ein.

## Deployen

**Vercel:** GitHub-Repository importieren, Framework Next.js, Node 22, alle benötigten Umgebungsvariablen für Produktion setzen. PostgreSQL separat bereitstellen. Migration vor Freischaltung mit `npm run db:migrate` gegen dieselbe Datenbank ausführen. Build `npm run build`; alternativ den mitgelieferten pnpm-Lockfile-Workflow verwenden. Stripe-Endpunkt, Medien-CORS, verifizierten Mail-Absender und Scheduler auf die produktive Domain abstimmen.

**Railway/Render/Node-Host:** `npm install`, `npm run db:migrate`, `npm run build`, dann `npm start`. Die Anwendung nutzt `PORT` vom Hoster. Node 22 und PostgreSQL erforderlich. Nicht als rein statische Seite deployen: Admin, Preise, Checkout und Webhooks benötigen den Server.

**Docker:** `docker build -t bigmamareps .`; anschließend `docker run --env-file .env -p 3000:3000 bigmamareps`. Migrationen separat mit der gleichen Release-Version vor Start ausführen. Im schlanken Runtime-Image läuft ausschließlich der Standalone-Server als unprivilegierter Nutzer. Das Image wurde hier nicht ausgeführt; eine Docker-Engine war nicht verfügbar.

Vor echtem Verkauf: rechtliche Platzhalter und Größenangaben ersetzen, reale Produkte/Fotos verwenden, Versand-/Retourenbedingungen und Steuerbehandlung festlegen. Beträge sind EUR-Endpreise; automatische Steuerberechnung und Steuerregistrierungen sind nicht konfiguriert. Für Schweiz-Lieferungen etwaige Einfuhrabgaben in den Versandinformationen klar erklären.

## Prüfung und Struktur

```bash
npm run typecheck
npm test
npm run build
```

Tests starten eine flüchtige PostgreSQL-kompatible PGlite-Datenbank und prüfen die echten Prisma-Migrationen sowie Checkout-/Webhook-Code mit Stripe-Stubs. PGlite serialisiert Verbindungen; einen Last-/Parallelitätstest gegen echtes PostgreSQL vor hohem Bestellaufkommen ergänzen. Echte Stripe-, S3-, E-Mail- und Telegram-Zugangsdaten werden nicht benötigt und wurden nicht verwendet.

```text
app/(shop)/           Öffentliche Shop-Routen
app/admin/            Login und geschützte Verwaltung
app/api/admin/        Autorisierte Verwaltungs-APIs
app/api/checkout/     Serverseitiger Checkout
app/api/webhooks/     Signierte Stripe-Ereignisse
app/api/cron/         Authentifizierter Abgleich
components/shop/     Katalog, Varianten, Drawer, Checkout
components/admin/    Editoren und Verwaltung
lib/                 DB, Auth, Preise, Stripe, Outbox, Validierung
prisma/              Schema, versionierte Migrationen, Seed
tests/               Preis-, Sicherheits- und Bestelltests
```

Optionale Kundenkonten, Newsletter, Gutscheine und Browser-Push sind nicht implementiert. Der Shop nutzt Gast-Checkout; Telegram ist die zusätzliche mobile Benachrichtigung. Produktentfernung erfolgt durch Deaktivierung, sodass Bestellhistorie erhalten bleibt.
