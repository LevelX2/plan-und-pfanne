# Aktive Gerichte im Wochenplan und selektive Einkaufsliste

## Quelle
- Chat-Anforderung vom 2026-04-23

## Nutzeranliegen
> Überlege dir einmal konzeptionell, wie wir es anstellen können, dass wenn man vom Wochenplan nur Teile kochen möchte, dass man diese Gerichte, die man kochen möchte, markieren kann und das sozusagen als den aktiven Wochenplan dann sieht und damit auch nur die Zutaten dazu in der Einkaufsliste bekommt. Man kann natürlich alle oder ausgewählten in der Zutatenliste auswählen und man kann halt jederzeit bei der Liste der Gerichte ein Gericht ein- oder ausschalten. Ja, möchte ich, ja, möchte ich nicht. Und das wirkt sich dann auf die Zutatenliste entsprechend aus. Und im Initialzustand ist erstmal nichts ausgewählt, damit kommt in der Zutatenliste kommt dann erstmal, wir haben noch keine Gerichte aktiv ausgewählt. Und man könnte natürlich sagen, trotzdem alle oder halt nur die für die Ausgewählten. Und auf der Wochenübersicht kann man halt die einzelnen Gerichte ein- und ausschalten, so als aktive Selektion. Siehst du das logisch schlüssig oder würdest du zusätzliche Anpassungen aufgrund der Anforderungen vornehmen? Und wie würden deine Vorschläge diesbezüglich aussehen, was man anpassen sollte?

## Kernaussagen aus der Anforderung
- Geplante Gerichte im Wochenplan sollen einzeln aktivierbar und deaktivierbar sein.
- Die aktive Auswahl soll als eine Art aktueller Kochfokus innerhalb derselben Woche sichtbar sein.
- Die Einkaufsliste soll Zutaten nur für aktiv ausgewählte Gerichte ableiten können.
- In der Einkaufsliste soll weiterhin eine Umschaltung zwischen allen Gerichten und nur ausgewählten Gerichten denkbar bleiben.
- Der Initialzustand der aktiven Auswahl soll leer sein.
- Wenn noch keine Gerichte aktiv sind, soll die Einkaufsliste einen klaren Leerzustand anzeigen statt stillschweigend alle Zutaten zu zeigen.
