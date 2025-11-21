# Jak wyczyścić dane testowe

## Web (przeglądarka)

### Metoda 1: Konsola przeglądarki (najłatwiejsza)
1. Otwórz aplikację w przeglądarce
2. Naciśnij F12 aby otworzyć DevTools
3. Przejdź do zakładki "Console"
4. Wpisz: `clearWebStorage()`
5. Naciśnij Enter
6. Odśwież stronę (F5)

### Metoda 2: Ręcznie przez DevTools
1. Otwórz DevTools (F12)
2. Przejdź do zakładki "Application"
3. W lewym menu wybierz "Local Storage"
4. Kliknij prawym na domenę i wybierz "Clear"
5. Odśwież stronę (F5)

## Mobile (telefon/tablet)

### Metoda 1: Odinstaluj aplikację Expo Go
1. Odinstaluj aplikację Expo Go z telefonu
2. Zainstaluj ją ponownie ze sklepu
3. Zeskanuj kod QR ponownie

### Metoda 2: Wyczyść dane aplikacji (Android)
1. Ustawienia → Aplikacje → Expo Go
2. Pamięć → Wyczyść dane
3. Zeskanuj kod QR ponownie

### Metoda 3: Wyczyść dane aplikacji (iOS)
1. Odinstaluj i zainstaluj ponownie Expo Go
   (iOS nie pozwala na czyszczenie danych bez odinstalowania)

## Po wyczyszczeniu danych

Aplikacja uruchomi się z pustą bazą danych. Możesz teraz:
1. Dodać własnych klientów
2. Stworzyć własne zlecenia
3. Dodać pomieszczenia i punkty pomiarowe
4. Wprowadzić wyniki pomiarów

Wszystkie dane będą zapisywane lokalnie na urządzeniu.
