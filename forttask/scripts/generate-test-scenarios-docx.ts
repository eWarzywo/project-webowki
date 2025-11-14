import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    BorderStyle,
    HeadingLevel,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';

interface TestScenario {
    id: string;
    methodName: string;
    goal: string;
    fileReference: string;
    prerequisites: string;
    steps: string[];
    testData: string;
    priority: 'High' | 'Medium' | 'Low';
    expectedResult: string;
    cleanup?: string;
    additionalNotes?: string;
    category: string;
}

const testScenarios: TestScenario[] = [
    // Authentication scenarios
    {
        id: 'AUTH-001',
        methodName: 'signIn should authenticate user with valid credentials',
        goal: 'Sprawdzenie poprawnego logowania użytkownika z prawidłowymi danymi uwierzytelniającymi',
        fileReference: 'forttask/test/auth-api.test.ts',
        prerequisites: 'Użytkownik z prawidłowymi danymi logowania istnieje w bazie danych. Mock NextAuth signIn jest skonfigurowany.',
        steps: [
            'Wywołaj funkcję signIn z prawidłowymi danymi (username: testuser, password: correct_password)',
            'Ustaw redirect: false',
            'Sprawdź odpowiedź',
        ],
        testData: '{ username: "testuser", password: "correct_password", redirect: false }',
        priority: 'High',
        expectedResult: 'Funkcja signIn zwraca obiekt z ok: true, error: null, status: 200',
        additionalNotes: 'Test wykorzystuje mocked NextAuth. Waliduje podstawowy flow uwierzytelniania.',
        category: 'Authentication',
    },
    {
        id: 'AUTH-002',
        methodName: 'signIn should return error with invalid credentials',
        goal: 'Weryfikacja obsługi błędnych danych logowania',
        fileReference: 'forttask/test/auth-api.test.ts',
        prerequisites: 'Mock NextAuth zwraca błąd dla nieprawidłowych danych',
        steps: [
            'Wywołaj signIn z nieprawidłowym hasłem (wrong_password)',
            'Sprawdź odpowiedź błędu',
        ],
        testData: '{ username: "testuser", password: "wrong_password", redirect: false }',
        priority: 'High',
        expectedResult: 'Zwracany obiekt zawiera ok: false, error: "Invalid username or password", status: 401',
        additionalNotes: 'Zapewnia, że aplikacja prawidłowo obsługuje błędne dane logowania',
        category: 'Authentication',
    },
    {
        id: 'AUTH-003',
        methodName: 'signOut should successfully log user out',
        goal: 'Test poprawnego wylogowania użytkownika',
        fileReference: 'forttask/test/auth-api.test.ts',
        prerequisites: 'Użytkownik jest zalogowany. Mock NextAuth signOut jest dostępny.',
        steps: [
            'Wywołaj signOut z redirect: false',
            'Sprawdź wynik operacji',
        ],
        testData: '{ redirect: false }',
        priority: 'High',
        expectedResult: 'Funkcja signOut zwraca ok: true i pusty url',
        category: 'Authentication',
    },
    {
        id: 'AUTH-004',
        methodName: 'User registration should create account and return 201',
        goal: 'Test rejestracji nowego użytkownika',
        fileReference: 'forttask/test/auth-api.test.ts',
        prerequisites: 'Baza danych nie zawiera użytkownika z podanym emailem. Mock bcrypt.hash i prisma.user.create są skonfigurowane.',
        steps: [
            'Przygotuj dane nowego użytkownika (firstName, lastName, email, password)',
            'Wyślij POST request do /api/user',
            'Sprawdź czy hasło zostało zahashowane',
            'Zweryfikuj utworzenie użytkownika w bazie',
        ],
        testData: '{ firstName: "Test", lastName: "User", email: "newuser@example.com", password: "password123" }',
        priority: 'High',
        expectedResult: 'Status 201, wiadomość "Konto zostało utworzone", obiekt user bez passwordHash',
        cleanup: 'Mock prisma zostaje wyczyszczony w beforeEach',
        additionalNotes: 'Test weryfikuje hashowanie hasła i nie zwracanie passwordHash w odpowiedzi',
        category: 'Authentication',
    },
    {
        id: 'AUTH-005',
        methodName: 'User registration should fail with duplicate email',
        goal: 'Weryfikacja obsługi duplikatu emaila przy rejestracji',
        fileReference: 'forttask/test/auth-api.test.ts',
        prerequisites: 'Użytkownik z emailem existing@example.com już istnieje w bazie',
        steps: [
            'Spróbuj zarejestrować użytkownika z istniejącym emailem',
            'Wyślij POST request do /api/user',
            'Sprawdź odpowiedź błędu',
        ],
        testData: '{ firstName: "Test", lastName: "User", email: "existing@example.com", password: "password123" }',
        priority: 'High',
        expectedResult: 'Status 409, wiadomość "Użytkownik o podanym adresie email już istnieje"',
        additionalNotes: 'prisma.user.create nie powinien być wywołany',
        category: 'Authentication',
    },

    // Bills scenarios
    {
        id: 'BILL-001',
        methodName: 'should render the bills page with form and list components',
        goal: 'Weryfikacja renderowania strony rachunków z formularzem i listą',
        fileReference: 'forttask/test/bill.test.tsx',
        prerequisites: 'Użytkownik zalogowany z householdId. Mocked useSession, useRouter, useSocket.',
        steps: [
            'Renderuj komponent Bills',
            'Sprawdź obecność formularza dodawania rachunku',
            'Sprawdź obecność pól: Name, Cost, Due to',
            'Zweryfikuj przyciski Cancel i Add',
            'Sprawdź obecność listy rachunków',
        ],
        testData: 'Brak - test renderowania',
        priority: 'Medium',
        expectedResult: 'Wszystkie elementy UI są renderowane poprawnie: nagłówki, pola formularza, przyciski, lista',
        category: 'Bills',
    },
    {
        id: 'BILL-002',
        methodName: 'should handle bill form submission',
        goal: 'Test tworzenia nowego rachunku przez formularz',
        fileReference: 'forttask/test/bill.test.tsx',
        prerequisites: 'Mock DatePicker, fetch API zwraca sukces, użytkownik w gospodarstwie domowym',
        steps: [
            'Wpisz nazwę rachunku: "Rent"',
            'Wpisz koszt: 800',
            'Wybierz datę: 2025-05-31',
            'Kliknij przycisk Add',
            'Sprawdź wywołanie API',
        ],
        testData: '{ name: "Rent", amount: 800, dueDate: "2025-05-31..." }',
        priority: 'High',
        expectedResult: 'POST /api/bill zostaje wywołany z poprawnymi danymi. emitUpdate jest wywołany.',
        additionalNotes: 'Test sprawdza również integrację z DatePicker',
        category: 'Bills',
    },
    {
        id: 'BILL-003',
        methodName: 'should validate form input and show error messages',
        goal: 'Weryfikacja walidacji formularza rachunków',
        fileReference: 'forttask/test/bill.test.tsx',
        prerequisites: 'Komponent Bills jest wyrenderowany',
        steps: [
            'Wypełnij nazwę za krótką wartością (np. "Re")',
            'Wypełnij koszt: 10',
            'Wybierz datę',
            'Kliknij Add',
            'Sprawdź komunikat błędu',
            'Wyczyść pola i ponów',
        ],
        testData: '{ name: "Re", amount: 10 } oraz puste pola',
        priority: 'Medium',
        expectedResult: 'Komunikaty błędów: "Name must be at least 3" oraz "Please fill in" dla pustych pól',
        category: 'Bills',
    },
    {
        id: 'BILL-004',
        methodName: 'should fetch and display bill items',
        goal: 'Test pobierania i wyświetlania listy rachunków',
        fileReference: 'forttask/test/bill.test.tsx',
        prerequisites: 'Mock fetch zwraca listę 3 rachunków',
        steps: [
            'Renderuj BillsHandler',
            'Poczekaj na załadowanie danych',
            'Sprawdź wywołania API',
            'Zweryfikuj wyświetlenie rachunków',
        ],
        testData: 'mockBills: [{ id: 1, name: "Electricity", amount: 75.5 }, ...]',
        priority: 'High',
        expectedResult: 'API /api/bill i /api/bill/totalNumber są wywołane. Lista wyświetla: Electricity - 75.5$, Internet - 50$, Water Bill - 35.25$',
        category: 'Bills',
    },
    {
        id: 'BILL-005',
        methodName: 'should handle marking a bill as paid',
        goal: 'Test oznaczania rachunku jako opłaconego',
        fileReference: 'forttask/test/bill.test.tsx',
        prerequisites: 'Rachunek z id: 1 jest wyświetlony w szczegółach',
        steps: [
            'Kliknij przycisk details dla rachunku',
            'Sprawdź otwarcie okna szczegółów',
            'Kliknij "Mark as paid"',
            'Zweryfikuj wywołanie API',
        ],
        testData: '{ id: 1, paid: true }',
        priority: 'High',
        expectedResult: 'PUT /api/bill/paidToggle jest wywołany z id: 1, paid: true',
        category: 'Bills',
    },
    {
        id: 'BILL-006',
        methodName: 'should handle delete confirmation',
        goal: 'Test usuwania rachunku z potwierdzeniem',
        fileReference: 'forttask/test/bill.test.tsx',
        prerequisites: 'Rachunek jest wyświetlony na liście',
        steps: [
            'Kliknij przycisk delete',
            'Sprawdź pojawienie się okna potwierdzenia',
            'Kliknij Delete w oknie potwierdzenia',
            'Zweryfikuj wywołanie handleDelete',
        ],
        testData: 'billId: 1',
        priority: 'High',
        expectedResult: 'handleDelete(1) zostaje wywołany po potwierdzeniu',
        additionalNotes: 'Test sprawdza również anulowanie usuwania',
        category: 'Bills',
    },

    // Chores scenarios
    {
        id: 'CHORE-001',
        methodName: 'should create a new chore and return it',
        goal: 'Test tworzenia nowej pracy domowej',
        fileReference: 'forttask/test/chore.test.ts',
        prerequisites: 'Użytkownik zalogowany z householdId. Mock session i prisma.chore.create.',
        steps: [
            'Przygotuj dane chore (name, dueDate, priority, cycle, description)',
            'Wyślij POST request do /api/chore/create',
            'Sprawdź odpowiedź',
        ],
        testData: '{ name: "Test Chore", dueDate: "2023-10-01", priority: 1, cycle: 0, repeatCount: 0, description: "Test Description" }',
        priority: 'High',
        expectedResult: 'Status 201, zwrócony obiekt chore z przypisanym id',
        category: 'Chores',
    },
    {
        id: 'CHORE-002',
        methodName: 'should return 401 if user is not logged in',
        goal: 'Weryfikacja autoryzacji przy tworzeniu chore',
        fileReference: 'forttask/test/chore.test.ts',
        prerequisites: 'Brak sesji użytkownika (getServerSession zwraca null)',
        steps: [
            'Wyślij POST request bez sesji',
            'Sprawdź status odpowiedzi',
        ],
        testData: 'Brak',
        priority: 'High',
        expectedResult: 'Status 401, wiadomość "You must be logged in to create chores"',
        category: 'Chores',
    },
    {
        id: 'CHORE-003',
        methodName: 'should return 401 if user is not part of a household',
        goal: 'Weryfikacja wymagania przynależności do gospodarstwa domowego',
        fileReference: 'forttask/test/chore.test.ts',
        prerequisites: 'Użytkownik zalogowany ale bez householdId',
        steps: [
            'Wyślij POST request z sesją bez householdId',
            'Sprawdź odpowiedź',
        ],
        testData: 'Session: { user: { id: "1" } }',
        priority: 'High',
        expectedResult: 'Status 401, wiadomość "You must be part of a household to create chores"',
        category: 'Chores',
    },
    {
        id: 'CHORE-004',
        methodName: 'should return a list of chores',
        goal: 'Test pobierania listy prac do wykonania',
        fileReference: 'forttask/test/chore.test.ts',
        prerequisites: 'Użytkownik w gospodarstwie domowym. Mock prisma.chore.findMany zwraca 2 chores.',
        steps: [
            'Wyślij GET request do /api/chores/todo/get',
            'Sprawdź odpowiedź',
        ],
        testData: 'Brak - GET request',
        priority: 'High',
        expectedResult: 'Status 200, zwrócona lista chores i count',
        category: 'Chores',
    },
    {
        id: 'CHORE-005',
        methodName: 'should update a chore and return it',
        goal: 'Test aktualizacji statusu chore na todo/done',
        fileReference: 'forttask/test/chore.test.ts',
        prerequisites: 'Chore z id: 1 istnieje. Użytkownik ma uprawnienia.',
        steps: [
            'Wyślij PUT request do /api/chore/todo z choreId: 1',
            'Sprawdź odpowiedź',
        ],
        testData: '{ choreId: 1 }',
        priority: 'High',
        expectedResult: 'Status 200, zwrócony zaktualizowany obiekt chore',
        category: 'Chores',
    },
    {
        id: 'CHORE-006',
        methodName: 'should delete a chore and return it',
        goal: 'Test usuwania pracy domowej',
        fileReference: 'forttask/test/chore.test.ts',
        prerequisites: 'Chore istnieje, użytkownik ma uprawnienia',
        steps: [
            'Wyślij DELETE request z choreId',
            'Sprawdź status i odpowiedź',
        ],
        testData: '{ choreId: 1 }',
        priority: 'High',
        expectedResult: 'Status 200, wiadomość "Chore deleted successfully", zwrócony usunięty chore',
        category: 'Chores',
    },

    // Events scenarios
    {
        id: 'EVENT-001',
        methodName: 'should return events for the authenticated user',
        goal: 'Test pobierania listy wydarzeń dla zalogowanego użytkownika',
        fileReference: 'forttask/test/event.test.ts',
        prerequisites: 'Użytkownik zalogowany z householdId. Mock prisma.event.findMany.',
        steps: [
            'Wyślij GET request do /api/events/get z datą',
            'Sprawdź odpowiedź',
        ],
        testData: 'searchParams: { date: "2023-10-01" }',
        priority: 'High',
        expectedResult: 'Status 200, zwrócona lista events i count',
        category: 'Events',
    },
    {
        id: 'EVENT-002',
        methodName: 'should create an event for the authenticated user',
        goal: 'Test tworzenia nowego wydarzenia',
        fileReference: 'forttask/test/event.test.ts',
        prerequisites: 'Użytkownik w gospodarstwie domowym. Mock prisma.event.create i eventAttendee.createMany.',
        steps: [
            'Przygotuj dane wydarzenia (name, description, date, location, attendees)',
            'Wyślij POST request do /api/event/create',
            'Sprawdź utworzenie wydarzenia i uczestników',
        ],
        testData: '{ name: "Test Event", description: "...", date: "2023-10-01", location: "Test Location", cycle: 1, repeatCount: 0, attendees: [1] }',
        priority: 'High',
        expectedResult: 'Status 201, zwrócony obiekt wydarzenia',
        additionalNotes: 'Test sprawdza również dodanie uczestników',
        category: 'Events',
    },
    {
        id: 'EVENT-003',
        methodName: 'should delete an event for the authenticated user',
        goal: 'Test usuwania wydarzenia',
        fileReference: 'forttask/test/event.test.ts',
        prerequisites: 'Wydarzenie istnieje, użytkownik jest autorem lub w tym samym gospodarstwie',
        steps: [
            'Wyślij DELETE request z eventId',
            'Sprawdź autoryzację i usunięcie',
        ],
        testData: '{ eventId: "1" }',
        priority: 'High',
        expectedResult: 'Status 204 (No Content) po pomyślnym usunięciu',
        additionalNotes: 'Test sprawdza również błędy 404 (not found), 403 (not authorized)',
        category: 'Events',
    },
    {
        id: 'EVENT-004',
        methodName: 'should return 401 if user is not authenticated',
        goal: 'Weryfikacja autoryzacji dla operacji na wydarzeniach',
        fileReference: 'forttask/test/event.test.ts',
        prerequisites: 'Brak sesji użytkownika',
        steps: [
            'Wyślij request bez sesji',
            'Sprawdź status odpowiedzi',
        ],
        testData: 'Brak',
        priority: 'High',
        expectedResult: 'Status 401 dla GET, POST i DELETE',
        category: 'Events',
    },

    // Household scenarios
    {
        id: 'HOUSE-001',
        methodName: 'POST Household with correct data should return new Household and status 201',
        goal: 'Test tworzenia nowego gospodarstwa domowego',
        fileReference: 'forttask/test/household.test.ts',
        prerequisites: 'Mock prisma.household.create skonfigurowany',
        steps: [
            'Przygotuj dane: name, joinCode, ownerId',
            'Wyślij POST request do /api/household',
            'Sprawdź odpowiedź',
        ],
        testData: '{ name: "Test Household", joinCode: "ABC123", ownerId: 1 }',
        priority: 'High',
        expectedResult: 'Status 201, zwrócony obiekt household z id',
        category: 'Household',
    },
    {
        id: 'HOUSE-002',
        methodName: 'POST Household with missing fields should return 400',
        goal: 'Weryfikacja walidacji wymaganych pól',
        fileReference: 'forttask/test/household.test.ts',
        prerequisites: 'Brak',
        steps: [
            'Wyślij POST request z pustym body',
            'Sprawdź odpowiedź błędu',
        ],
        testData: '{}',
        priority: 'Medium',
        expectedResult: 'Status 400, error: "Invalid request"',
        category: 'Household',
    },
    {
        id: 'HOUSE-003',
        methodName: 'GET Household with valid householdId should return Household',
        goal: 'Test pobierania danych gospodarstwa domowego',
        fileReference: 'forttask/test/household.test.ts',
        prerequisites: 'Household z id: 1 istnieje',
        steps: [
            'Wyślij GET request z householdId=1',
            'Sprawdź odpowiedź',
        ],
        testData: 'householdId=1',
        priority: 'High',
        expectedResult: 'Status 200, zwrócony obiekt household',
        category: 'Household',
    },

    // Shopping List scenarios
    {
        id: 'SHOP-001',
        methodName: 'should return 401 if user is not logged in',
        goal: 'Weryfikacja autoryzacji przy dostępie do listy zakupów',
        fileReference: 'forttask/test/shopping.test.ts',
        prerequisites: 'Brak sesji użytkownika',
        steps: [
            'Wyślij GET request do /api/shoppingList bez sesji',
            'Sprawdź status',
        ],
        testData: 'Brak',
        priority: 'High',
        expectedResult: 'Status 401, wiadomość "You must be logged in to view the shopping list"',
        category: 'Shopping',
    },
    {
        id: 'SHOP-002',
        methodName: 'should return 403 if user is not a member of a household',
        goal: 'Weryfikacja wymagania przynależności do gospodarstwa',
        fileReference: 'forttask/test/shopping.test.ts',
        prerequisites: 'Użytkownik zalogowany ale householdId jest null',
        steps: [
            'Wyślij GET request z sesją użytkownika bez household',
            'Sprawdź odpowiedź',
        ],
        testData: 'Session: { user: { id: "1" } }, user.householdId: null',
        priority: 'Medium',
        expectedResult: 'Status 403, wiadomość "You must be a member of a household to view the shopping list"',
        category: 'Shopping',
    },

    // Profile Pictures scenarios
    {
        id: 'PROFILE-001',
        methodName: 'Upload profile picture',
        goal: 'Test przesyłania zdjęcia profilowego użytkownika',
        fileReference: 'forttask/test/profilePictures.test.ts',
        prerequisites: 'Użytkownik zalogowany, plik obrazu dostępny',
        steps: [
            'Przygotuj plik obrazu',
            'Wyślij POST request z FormData',
            'Sprawdź odpowiedź',
        ],
        testData: 'FormData z plikiem obrazu',
        priority: 'Medium',
        expectedResult: 'Status 201 lub 200, zwrócone id zdjęcia profilowego',
        category: 'ProfilePictures',
    },

    // Overview scenarios
    {
        id: 'OVERVIEW-001',
        methodName: 'Overview page should display summary data',
        goal: 'Test wyświetlania strony przeglądu z podsumowaniem',
        fileReference: 'forttask/test/overview.test.ts',
        prerequisites: 'Użytkownik zalogowany z danymi w gospodarstwie',
        steps: [
            'Renderuj komponent Overview',
            'Sprawdź obecność sekcji: chores, events, bills, shopping',
            'Zweryfikuj dane',
        ],
        testData: 'Mock dane dla wszystkich sekcji',
        priority: 'Medium',
        expectedResult: 'Wszystkie sekcje są wyświetlone z aktualnymi danymi',
        category: 'Overview',
    },

    // Messages scenarios
    {
        id: 'MSG-001',
        methodName: 'Send and receive messages',
        goal: 'Test wysyłania i odbierania wiadomości w gospodarstwie',
        fileReference: 'forttask/test/messages.test.ts',
        prerequisites: 'Użytkownik w gospodarstwie domowym, socket connection',
        steps: [
            'Przygotuj wiadomość',
            'Wyślij wiadomość',
            'Sprawdź odbiór przez innych użytkowników',
        ],
        testData: '{ content: "Test message", householdId: 1 }',
        priority: 'Medium',
        expectedResult: 'Wiadomość zostaje zapisana i rozesłana do członków gospodarstwa',
        category: 'Messages',
    },

    // User CRUD scenarios
    {
        id: 'USER-001',
        methodName: 'Get user data',
        goal: 'Test pobierania danych użytkownika',
        fileReference: 'forttask/test/user.test.ts',
        prerequisites: 'Użytkownik zalogowany',
        steps: [
            'Wyślij GET request do /api/user/get',
            'Sprawdź odpowiedź',
        ],
        testData: 'Brak',
        priority: 'High',
        expectedResult: 'Zwrócone dane użytkownika bez passwordHash',
        category: 'User',
    },
    {
        id: 'USER-002',
        methodName: 'Update user profile',
        goal: 'Test aktualizacji profilu użytkownika',
        fileReference: 'forttask/test/user.test.ts',
        prerequisites: 'Użytkownik zalogowany',
        steps: [
            'Przygotuj zaktualizowane dane',
            'Wyślij PUT request',
            'Sprawdź aktualizację',
        ],
        testData: '{ firstName: "Updated", lastName: "Name" }',
        priority: 'Medium',
        expectedResult: 'Status 200, zaktualizowane dane użytkownika',
        category: 'User',
    },

    // Signup scenarios
    {
        id: 'SIGNUP-001',
        methodName: 'should render signup form',
        goal: 'Test renderowania formularza rejestracji',
        fileReference: 'forttask/test/signup.test.tsx',
        prerequisites: 'Brak',
        steps: [
            'Renderuj komponent Signup',
            'Sprawdź obecność pól: firstName, lastName, email, password',
            'Sprawdź przyciski',
        ],
        testData: 'Brak',
        priority: 'Medium',
        expectedResult: 'Wszystkie pola formularza i przyciski są wyrenderowane',
        category: 'Signup',
    },
    {
        id: 'SIGNUP-002',
        methodName: 'should validate email format',
        goal: 'Weryfikacja walidacji formatu emaila',
        fileReference: 'forttask/test/signup.test.tsx',
        prerequisites: 'Formularz rejestracji wyrenderowany',
        steps: [
            'Wpisz nieprawidłowy email',
            'Spróbuj wysłać formularz',
            'Sprawdź komunikat błędu',
        ],
        testData: 'email: "invalid-email"',
        priority: 'Medium',
        expectedResult: 'Wyświetlony komunikat błędu o nieprawidłowym formacie emaila',
        category: 'Signup',
    },
];

function createDocument(): Document {
    const today = new Date().toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Group scenarios by category
    const groupedScenarios: { [key: string]: TestScenario[] } = {};
    testScenarios.forEach((scenario) => {
        if (!groupedScenarios[scenario.category]) {
            groupedScenarios[scenario.category] = [];
        }
        groupedScenarios[scenario.category].push(scenario);
    });

    const sections: any[] = [];

    // Title page section
    sections.push({
        properties: {
            page: {
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
        },
        children: [
            new Paragraph({
                text: 'Scenariusze testowe — FortTask',
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            }),
            new Paragraph({
                text: `Data wygenerowania: ${today}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 800 },
            }),
            new Paragraph({ text: '', pageBreakBefore: true }),
            // How to use this document
            new Paragraph({
                text: 'Jak używać tego dokumentu',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 200, after: 200 },
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Ten dokument zawiera kompleksowe scenariusze testowe dla aplikacji FortTask. ',
                    }),
                ],
                spacing: { after: 100 },
            }),
            new Paragraph({
                children: [new TextRun({ text: 'Instrukcja dla zespołu QA:', bold: true })],
                spacing: { before: 100, after: 100 },
            }),
            new Paragraph({
                text: '1. Każdy scenariusz testowy jest umieszczony w osobnej tabeli z obramowaniem',
                numbering: { reference: 'default-numbering', level: 0 },
                spacing: { after: 50 },
            }),
            new Paragraph({
                text: '2. Scenariusze są pogrupowane według kategorii (Authentication, Bills, Chores, itp.)',
                numbering: { reference: 'default-numbering', level: 0 },
                spacing: { after: 50 },
            }),
            new Paragraph({
                text: '3. Każdy scenariusz zawiera: ID, cel testu, odniesienie do pliku źródłowego, warunki wstępne, kroki, dane testowe, priorytet i oczekiwany rezultat',
                numbering: { reference: 'default-numbering', level: 0 },
                spacing: { after: 50 },
            }),
            new Paragraph({
                text: '4. Priorytety: High (krytyczny), Medium (ważny), Low (opcjonalny)',
                numbering: { reference: 'default-numbering', level: 0 },
                spacing: { after: 50 },
            }),
            new Paragraph({
                text: '5. Odniesienia do plików testowych pozwalają na weryfikację implementacji w kodzie',
                numbering: { reference: 'default-numbering', level: 0 },
                spacing: { after: 400 },
            }),
            new Paragraph({ text: '', pageBreakBefore: true }),
            // Table of Contents
            new Paragraph({
                text: 'Spis treści',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 200, after: 200 },
            }),
            ...Object.keys(groupedScenarios).map(
                (category, index) =>
                    new Paragraph({
                        text: `${index + 1}. ${category} (${groupedScenarios[category].length} scenariuszy)`,
                        spacing: { after: 100 },
                    }),
            ),
            new Paragraph({ text: '', pageBreakBefore: true }),
        ],
    });

    // Add scenarios for each category
    Object.keys(groupedScenarios).forEach((category) => {
        const categoryChildren: any[] = [];

        categoryChildren.push(
            new Paragraph({
                text: category,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
            }),
        );

        groupedScenarios[category].forEach((scenario) => {
            // Create a table for scenario
            const scenarioTable = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                    left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                    right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                },
                rows: [
                    // Header row with 3 columns
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: 'Id: ', bold: true }),
                                            new TextRun({ text: scenario.id }),
                                        ],
                                    }),
                                ],
                                width: { size: 33, type: WidthType.PERCENTAGE },
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: 'Priorytet: ', bold: true }),
                                            new TextRun({ text: `[${scenario.priority}]` }),
                                        ],
                                    }),
                                ],
                                width: { size: 33, type: WidthType.PERCENTAGE },
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: 'Kategoria: ', bold: true }),
                                            new TextRun({ text: scenario.category }),
                                        ],
                                    }),
                                ],
                                width: { size: 34, type: WidthType.PERCENTAGE },
                            }),
                        ],
                    }),
                    // Second row with 3 columns
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: 'Nazwa metody:', bold: true })],
                                        spacing: { after: 50 },
                                    }),
                                    new Paragraph({ text: scenario.methodName }),
                                ],
                                width: { size: 33, type: WidthType.PERCENTAGE },
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: 'Cel testu:', bold: true })],
                                        spacing: { after: 50 },
                                    }),
                                    new Paragraph({ text: scenario.goal }),
                                ],
                                width: { size: 33, type: WidthType.PERCENTAGE },
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: 'Plik testowy:', bold: true })],
                                        spacing: { after: 50 },
                                    }),
                                    new Paragraph({ text: scenario.fileReference }),
                                ],
                                width: { size: 34, type: WidthType.PERCENTAGE },
                            }),
                        ],
                    }),
                    // Full width rows
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: 'Warunki wstępne:', bold: true })],
                                        spacing: { after: 50 },
                                    }),
                                    new Paragraph({ text: scenario.prerequisites }),
                                ],
                                columnSpan: 3,
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: 'Kroki do wykonania:', bold: true })],
                                        spacing: { after: 50 },
                                    }),
                                    ...scenario.steps.map(
                                        (step, index) => new Paragraph({ text: `${index + 1}. ${step}` }),
                                    ),
                                ],
                                columnSpan: 3,
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: 'Dane testowe:', bold: true })],
                                        spacing: { after: 50 },
                                    }),
                                    new Paragraph({ text: scenario.testData }),
                                ],
                                columnSpan: 3,
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: 'Oczekiwany rezultat:', bold: true })],
                                        spacing: { after: 50 },
                                    }),
                                    new Paragraph({ text: scenario.expectedResult }),
                                ],
                                columnSpan: 3,
                            }),
                        ],
                    }),
                    ...(scenario.cleanup
                        ? [
                              new TableRow({
                                  children: [
                                      new TableCell({
                                          children: [
                                              new Paragraph({
                                                  children: [new TextRun({ text: 'Cleanup:', bold: true })],
                                                  spacing: { after: 50 },
                                              }),
                                              new Paragraph({ text: scenario.cleanup }),
                                          ],
                                          columnSpan: 3,
                                      }),
                                  ],
                              }),
                          ]
                        : []),
                    ...(scenario.additionalNotes
                        ? [
                              new TableRow({
                                  children: [
                                      new TableCell({
                                          children: [
                                              new Paragraph({
                                                  children: [new TextRun({ text: 'Dodatkowe uwagi:', bold: true })],
                                                  spacing: { after: 50 },
                                              }),
                                              new Paragraph({ text: scenario.additionalNotes }),
                                          ],
                                          columnSpan: 3,
                                      }),
                                  ],
                              }),
                          ]
                        : []),
                ],
            });

            categoryChildren.push(scenarioTable);
            categoryChildren.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        });

        sections.push({
            properties: {
                page: {
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
                },
            },
            children: categoryChildren,
        });
    });

    // Add template and best practices section
    sections.push({
        properties: {
            page: {
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
        },
        children: [
            new Paragraph({
                text: 'Szablon scenariusza testowego',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 200, after: 200 },
            }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                    left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                    right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: 'Id / Nazwa metody:', bold: true })],
                                    }),
                                ],
                            }),
                            new TableCell({ children: [new Paragraph({ text: '[UNIKALNE_ID - NAZWA]' })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: 'Cel testu:', bold: true })] })],
                            }),
                            new TableCell({ children: [new Paragraph({ text: '[OPIS CELU]' })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: 'Metoda / plik testowy:', bold: true })],
                                    }),
                                ],
                            }),
                            new TableCell({ children: [new Paragraph({ text: '[ŚCIEŻKA/DO/PLIKU.test.ts]' })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: 'Warunki wstępne:', bold: true })],
                                    }),
                                ],
                            }),
                            new TableCell({ children: [new Paragraph({ text: '[STAN DB, MOCKI, SESJA]' })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: 'Kroki do wykonania:', bold: true })],
                                    }),
                                ],
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({ text: '1. [KROK 1]' }),
                                    new Paragraph({ text: '2. [KROK 2]' }),
                                    new Paragraph({ text: '3. [KROK N]' }),
                                ],
                            }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: 'Dane testowe:', bold: true })],
                                    }),
                                ],
                            }),
                            new TableCell({ children: [new Paragraph({ text: '[JSON / WARTOŚCI]' })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: 'Priorytet:', bold: true })] })],
                            }),
                            new TableCell({ children: [new Paragraph({ text: '[High / Medium / Low]' })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: 'Oczekiwany rezultat:', bold: true })],
                                    }),
                                ],
                            }),
                            new TableCell({ children: [new Paragraph({ text: '[OCZEKIWANY WYNIK]' })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: 'Cleanup (opcjonalnie):', bold: true })],
                                    }),
                                ],
                            }),
                            new TableCell({ children: [new Paragraph({ text: '[CZYSZCZENIE PO TEŚCIE]' })] }),
                        ],
                    }),
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: 'Dodatkowe uwagi:', bold: true })],
                                    }),
                                ],
                            }),
                            new TableCell({ children: [new Paragraph({ text: '[NOTATKI]' })] }),
                        ],
                    }),
                ],
            }),
            new Paragraph({ text: '', pageBreakBefore: true }),
            // Best practices section
            new Paragraph({
                text: 'Dobre praktyki testowania',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 200, after: 200 },
            }),
            new Paragraph({
                text: '1. Przygotowanie środowiska testowego',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 100, after: 100 },
            }),
            new Paragraph({
                text: '• Zawsze używaj mocków dla zewnętrznych zależności (bazy danych, API)',
                bullet: { level: 0 },
            }),
            new Paragraph({
                text: '• Zapewnij izolację testów - każdy test powinien być niezależny',
                bullet: { level: 0 },
            }),
            new Paragraph({
                text: '• Czyszczenie po testach powinno być automatyczne (beforeEach/afterEach)',
                bullet: { level: 0 },
            }),
            new Paragraph({
                text: '2. Struktura testu',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
                text: '• Arrange (przygotowanie) - Setup danych i mocków',
                bullet: { level: 0 },
            }),
            new Paragraph({
                text: '• Act (działanie) - Wykonanie testowanej operacji',
                bullet: { level: 0 },
            }),
            new Paragraph({
                text: '• Assert (sprawdzenie) - Weryfikacja oczekiwanych rezultatów',
                bullet: { level: 0 },
            }),
            new Paragraph({
                text: '3. Nazewnictwo i opis',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
                text: '• Nazwy testów powinny jasno opisywać co jest testowane',
                bullet: { level: 0 },
            }),
            new Paragraph({
                text: '• Używaj konwencji: "should [oczekiwane zachowanie] when [warunek]"',
                bullet: { level: 0 },
            }),
            new Paragraph({
                text: '• Grupuj powiązane testy w blokach describe',
                bullet: { level: 0 },
            }),
            new Paragraph({
                text: '4. Priorytetyzacja',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
                text: '• High - Krytyczne ścieżki użytkownika i bezpieczeństwo',
                bullet: { level: 0 },
            }),
            new Paragraph({
                text: '• Medium - Funkcjonalności ważne ale nie krytyczne',
                bullet: { level: 0 },
            }),
            new Paragraph({
                text: '• Low - Edge cases i funkcje pomocnicze',
                bullet: { level: 0 },
            }),
            new Paragraph({
                text: '5. Asercje i weryfikacja',
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
            }),
            new Paragraph({
                text: '• Sprawdzaj nie tylko pozytywne ścieżki, ale też obsługę błędów',
                bullet: { level: 0 },
            }),
            new Paragraph({
                text: '• Weryfikuj statusy HTTP, strukturę danych i komunikaty błędów',
                bullet: { level: 0 },
            }),
            new Paragraph({
                text: '• Testuj granice i przypadki brzegowe (edge cases)',
                bullet: { level: 0 },
            }),
        ],
    });

    return new Document({
        sections: sections,
        styles: {
            default: {
                document: {
                    run: {
                        font: 'Calibri',
                        size: 24, // 12pt = 24 half-points
                    },
                },
            },
        },
        numbering: {
            config: [
                {
                    reference: 'default-numbering',
                    levels: [
                        {
                            level: 0,
                            format: 'decimal',
                            text: '%1.',
                            alignment: AlignmentType.LEFT,
                        },
                    ],
                },
            ],
        },
    });
}

async function generateDocx() {
    const doc = createDocument();
    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.join(__dirname, '../../docs/Scenariusze_testowe_FortTask.docx');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Document created successfully at: ${outputPath}`);
}

generateDocx().catch((error) => {
    console.error('Error generating document:', error);
    process.exit(1);
});
