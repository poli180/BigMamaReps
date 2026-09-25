# Lieferantenkatalog

24 Artikel aus https://linkbio.co/7021506IAj7db, abgerufen am 25.09.2026.
Je vier Herren-Schuhe, Damen-Schuhe, T-Shirts, Hosen, Sweatshirts und Jacken.

`supplier-catalog.json` enthält je Artikel das Originalalbum, den unveränderten Lieferantentitel, die Original-Bildadressen und die zugehörigen lokalen WebP-Dateien. Bilder wurden nur für Web-Auslieferung skaliert und komprimiert; Logos und Wasserzeichen bleiben erhalten. Marken-/Material- und Verfügbarkeitsangaben sind nicht unabhängig verifiziert. Bei widersprüchlichen Titeln wurde eine beschreibende Bezeichnung verwendet.

Die öffentliche Vorschau zeigt diesen Katalog, wenn keine Datenbank verbunden ist. Verkaufspreise und Bestände sind nicht erfunden: Preis folgt, Bestand 0. Es gibt keine fingierten Rabatte.

Mit einer Datenbank: im Admin unter Produkte auf „24 Produkte als Entwürfe übernehmen“ klicken oder `npm run db:seed` ausführen. Der Import ist wiederholbar, legt nur fehlende Artikel als inaktiv an und überschreibt keine bearbeiteten Artikel. Die alten sechs Beispielprodukte werden deaktiviert, nicht gelöscht. Vor Veröffentlichung Preise, konkrete Farb-/Größenvarianten, Bilderzuordnung, Material, Pflege und Bestand ergänzen.

Die Vorschau ersetzt keine produktive PostgreSQL-Datenbank. Ohne diese sind Admin-Schreibzugriffe und Checkout nicht funktionsfähig.
