---
name: review-docs
description: >-
  Weryfikuje składnię i zgodność kodu lub snippetów z aktualną dokumentacją bibliotek oraz frameworków,
  korzystając z MCP Context7. Stosuj, gdy użytkownik prosi o sprawdzenie dokumentacji, aktualności API,
  deprecacji, „czy ten kod jest zgodny z najnowszym X”, „zweryfikuj składnię względem docsów”, porównanie
  z oficjalnymi przykładami, review pod kątem wersji zależności albo gdy w kontekście pojawiają się
  stack (np. React, Next.js, Zustand, Tailwind) i wątpliwości co do aktualnej składni.
---

# Review dokumentacji (Context7)

## Cel

Sprawdzić, czy wskazany kod, konfiguracja lub snippet jest zgodny z **aktualną dokumentacją** oraz czy używa **zalecanych, nieprzestarzałych** wzorców — na podstawie źródeł pobranych przez **MCP Context7** (nie na podstawie wyłącznie pamięci modelu).

## Kiedy Context7 jest niedostępny

Jeśli narzędzia Context7 nie są podłączone lub wywołanie się nie powiedzie, napisz to wprost, opieraj się na `package.json` / lockfile i oficjalnych URL (bez udawania, że Context7 potwierdził treść).

## Przebieg

1. **Zakres** — ustal, co jest weryfikowane: plik(i), wklejony fragment, fragment README, config.
2. **Zależności** — z kodu i `package.json` (oraz ewentualnie lockfile) wypisz relevante pakiety i **zadeklarowane wersje** (np. `next`, `react`, `zustand`).
3. **Context7** — dla każdej kluczowej biblioteki / frameworka:
   - Rozwiąż identyfikator dokumentacji i pobierz **świeże** fragmenty dotyczące użytych API (komponenty, hooki, opcje konfiguracji, sygnatury), NIE polegając na domysłach.
   - Jeśli użytkownik poda konkretną wersję, staraj się dopasować dokumentację do tej gałęzi; jeśli nie — przyjmij dokumentację domyślną / najnowszą zwracaną przez Context7 i **zaznacz**, że „najnowsze” oznacza tu źródło z Context7, niekoniecznie ostatni release npm z danego dnia.
4. **Porównanie**:
   - **Składnia** — czy importy, nazwy eksportów, opcje i sygnatury zgadzaj się z dokumentacją?
   - **Deprecacje / migracje** — czy w docsach widać `deprecated`, breaking changes, zastąpione API?
   - **Konfiguracja** — dla plików typu `next.config`, `tailwind`, `tsconfig` — czy klucze i wartości są zgodne z aktualnymi przewodnikami?
5. **Wnioski** — podsumuj w formacie poniżej.

## Format wyniku

Dla każdego punktu:

- **OK** — krótko: co jest zgodne z dokumentacją (z odniesieniem do API / sekcji, jeśli Context7 ją nazwał).
- **Problem** — poziom: **blocker** / **warning** / **suggestion**; opis; **co mówi dokumentacja (Context7)**; **sugestia zmiany** (np. zastąpienie API, poprawka importu).

Na końcu krótka lista: **pakiety sprawdzone**, **wersje z `package.json`**, **czego Context7 nie pokrył** (jeśli coś pominąłeś).

## Zasady

- Nie twierdź, że „na pewno najnowsze na npm”, jeśli masz tylko snapshot z Context7 — formuluj ostrożnie.
- Jeśli kod jest poprawny i aktualny, **powiedz to wprost** i wymień, co jest zgodne z dokumentacją.
- Priorytet: bezpieczeństwo składni i API w runtime (błędne opcje, usunięte eksporty) nad kosmetyką stylu.
