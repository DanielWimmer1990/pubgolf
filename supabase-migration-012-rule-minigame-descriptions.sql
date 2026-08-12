-- Adds a description field to the shared rule/minigame template library,
-- and replaces the seed data with the curated list the host provided
-- (Regeln.docx / Minispiele.docx) — the short bold-marked name becomes the
-- suggestion text, the full sentence becomes the description shown in the
-- info box next to it in the round-setup dropdown.
alter table rule_templates add column if not exists description text;
alter table minigame_templates add column if not exists description text;

delete from rule_templates;
delete from minigame_templates;

insert into rule_templates (text, description) values
  ('Keine Namen', 'Es dürfen keine Namen genannt werden.'),
  ('Königliches WIR', 'Statt „ich“ darf nur noch „wir“ gesagt werden.'),
  ('Kein Fluchen', 'Es darf nicht geflucht werden.'),
  ('Fluchen nur mit Kompliment', 'Fluchen ist nur erlaubt, wenn direkt danach ein Kompliment folgt.'),
  ('Kein Zeigen', 'Es darf auf nichts und niemanden gezeigt werden.'),
  ('Nicht ins Gesicht fassen', 'Man darf sich nicht oberhalb des Halses berühren.'),
  ('Fotobomb', 'Der Spieler darf jederzeit „FOTO!“ rufen und ein Selfie machen. Wer nicht auf dem Foto ist, bekommt Strafpunkte.'),
  ('Schwache Hand', 'Es darf nur mit der schwachen Hand getrunken werden.'),
  ('Hund Sitz', 'Wer einen Hund sieht und zuerst „Hund Sitz!“ ruft, bekommt Gutpunkte.'),
  ('Magische Fee', 'Vor jedem Schluck muss die imaginäre Fee vom Glas genommen und danach wieder daraufgesetzt werden.'),
  ('Pfeifen', 'Vor jedem Schluck muss ins Getränk gepfiffen werden.'),
  ('Candy', 'Wer ein Candy ins Getränk trifft, bekommt Gutpunkte.'),
  ('Aufstehen', 'Vor jedem Sprechen muss man aufstehen.'),
  ('Königliche Welle', 'Vor jedem Schluck muss eine königliche Welle gemacht werden.'),
  ('Wortverbot', 'Bestimmte Wörter dürfen nicht gesagt werden (z. B. „Ja“, „Nein“, „Hallo“).'),
  ('Kein Augenkontakt', 'Bei Augenkontakt bekommen beide Spieler Strafpunkte.'),
  ('Kein Kratzen', 'Man darf sich nicht kratzen.'),
  ('Neuer Name', 'Jeder Spieler erhält einen neuen Namen, der für das gesamte Spiel gilt.'),
  ('Nichts berühren', 'Man darf nichts berühren und sich nirgends anlehnen.'),
  ('Gleich gesagt', 'Wer gleichzeitig dasselbe wie ein anderer Spieler sagt, bekommt Gutpunkte.'),
  ('Letzter ausgetrunken', 'Wer als Letzter austrinkt, bekommt Strafpunkte.'),
  ('Vorletzter ausgetrunken', 'Wer als Vorletzter austrinkt, bekommt Strafpunkte.'),
  ('Kein Lachen', 'Es darf nicht gelacht werden.'),
  ('Finger hoch', 'Beim Trinken muss der kleine Finger abgespreizt werden.'),
  ('Questionmaster', 'Es darf nicht mehr auf Fragen geantwortet werden.'),
  ('Andere Sprache', 'Es darf nur mehr z. B. auf Englisch gesprochen werden.'),
  ('Daumenregel', 'Legt ein Spieler unauffällig den Daumen auf den Tisch, müssen alle nachziehen. Der Letzte bekommt Strafpunkte.'),
  ('Verbeugen', 'Vor dem Hinsetzen muss man sich vor der Gruppe verbeugen.')
on conflict (text) do update set description = excluded.description;

insert into minigame_templates (name, description) values
  ('Gleich geschrieben', 'Es werden 3 Runden mit unterschiedlichen Kategorien (z. B. Monate, Planeten) gespielt. Jeder schreibt verdeckt einen passenden Begriff auf. Haben zwei oder mehr Spieler denselben Begriff, erhalten diese Strafpunkte.'),
  ('Liedtext erraten', 'Der Spieler sucht ein Lied aus, das kurz angespielt wird. Danach müssen die Spieler verdeckt aufschreiben, nach wie vielen Sekunden der erste Liedtext beginnt.'),
  ('Sternzerreißen', 'Alle stellen sich eng im Kreis auf. Dann wird gerufen: „3, 2, 1 – Sternzerreißen!“ Jeder springt gleichzeitig vom Kreis weg bzw. in eine beliebige Richtung. Danach ist reihum jeweils eine Bewegung bzw. ein Sprung erlaubt. Ziel ist es, mit dem eigenen Fuß auf den Fuß eines anderen Spielers zu steigen. Der angegriffene Spieler darf mit einer Ausweichbewegung reagieren. Wessen Fuß getroffen wird, scheidet aus bzw. erhält Strafpunkte.'),
  ('Knofeln', 'Jeder Spieler hält verdeckt 0–3 Münzen in der Hand. Reihum wird geschätzt, wie viele Münzen insgesamt im Spiel sind. Danach öffnen alle gleichzeitig ihre Hände. Wer die richtige Gesamtzahl errät, scheidet aus, bis nur noch ein Spieler übrig ist. In der ersten Runde darf niemand 0 Münzen in der Hand halten.'),
  ('Tip Top', 'Zwei Spieler stehen sich mit etwas Abstand gegenüber und nähern sich abwechselnd mit kleinen Fuß-an-Fuß-Schritten. Dabei wird ein Fuß immer direkt vor den anderen gesetzt. Wer zuerst auf den Schuh bzw. Fuß des anderen steigen kann, gewinnt.'),
  ('Weitsprung', 'Der Spieler, der am weitesten springt, gewinnt.'),
  ('Schere-Stein-Papier', 'Der Klassiker unter den Minispielen.'),
  ('Gleiche Zeit', 'Ein Spieler absolviert zweimal dieselbe kurze Strecke und versucht, beide Läufe möglichst exakt gleich schnell zu laufen. Je kleiner die Zeitdifferenz zwischen den beiden Läufen, desto besser.'),
  ('Stoppuhr', 'Jeder Spieler startet eine verdeckte Stoppuhr und versucht, diese nach exakt 60 Sekunden zu stoppen. Wer am nächsten an 60 Sekunden liegt, gewinnt.'),
  ('Gleiches Wort', 'Zwei Spieler sagen gleichzeitig jeweils ein beliebiges Wort. In jeder weiteren Runde versuchen sie, anhand der zuvor genannten Wörter auf dasselbe Wort zu kommen. Innerhalb von 5 Runden müssen beide gleichzeitig dasselbe Wort sagen.'),
  ('Zahlen-Duell', 'Zwei Spieler nennen gleichzeitig eine Zahl zwischen 1 und 100. Anschließend wird eine Zufallszahl gezogen. Wer näher an der gezogenen Zahl liegt, gewinnt die Runde.'),
  ('Karten Race', 'Jeder Spieler erhält ein Kartensymbol (Herz, Karo, Pik oder Kreuz). Die Karten werden nacheinander aufgedeckt. Das aufgedeckte Symbol darf jeweils eine weitere Karte ziehen. Das Symbol, das zuerst eine festgelegte Anzahl an Karten erreicht, gewinnt.'),
  ('21', 'Reihum darf jeder 1–3 aufeinanderfolgende Zahlen nennen. Wer die 21 sagen muss, verliert.'),
  ('Kategorie-Pingpong', 'Ein Spieler nennt eine Kategorie (z. B. Automarken). Reihum wird ein passender Begriff genannt. Wer einen Begriff wiederholt oder länger als 3 Sekunden überlegt, verliert.'),
  ('Daumen-Wrestling', 'Klassisches Daumen-Catchen – Best of 3.'),
  ('Reaktions-Duell', 'Zwei Spieler stehen sich gegenüber, ein Gegenstand liegt zwischen ihnen. Auf ein bestimmtes Kommando muss dieser geschnappt werden. Wer zuerst zugreift, gewinnt.'),
  ('Lippenlesen', 'Ein Spieler bekommt ein Wort und spricht es lautlos aus. Der andere hat drei Versuche, es zu erraten.'),
  ('Finger-Falle', 'Zwei Spieler zeigen gleichzeitig 1–5 Finger und nennen gleichzeitig die erwartete Gesamtsumme. Wer die Summe exakt trifft, gewinnt.')
on conflict (name) do update set description = excluded.description;
