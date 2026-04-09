// --- FIREBASE IMPORTS (dla <script type="module">) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// --- INICJALIZACJA FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyByGs3eCcMN6qpaLYH__Aqbuxx_HhzvY5I",
  authDomain: "goscinieczamosc-fe20d.firebaseapp.com",
  projectId: "goscinieczamosc-fe20d",
  storageBucket: "goscinieczamosc-fe20d.firebasestorage.app",
  messagingSenderId: "306978019202",
  appId: "1:306978019202:web:02c655aa77e6263677e19b"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Rejestracja nowego użytkownika ---
async function register(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Zarejestrowano:", userCredential.user.uid);
  } catch (error) {
    console.error("Błąd rejestracji:", error.message);
  }
}

// --- Logowanie istniejącego użytkownika ---
async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Zalogowano:", userCredential.user.uid);
  } catch (error) {
    console.error("Błąd logowania:", error.message);
  }
}

// --- Sprawdzenie stanu zalogowania ---
onAuthStateChanged(auth, user => {
  if (user) {
    console.log("Użytkownik zalogowany:", user.uid);
  } else {
    console.log("Brak zalogowanego użytkownika");
  }
});

// --- Zapis konfiguracji do Firestore ---
async function saveConfig(configData) {
  const user = auth.currentUser;
  if (!user) {
    console.error("Użytkownik niezalogowany!");
    return;
  }
  try {
    await addDoc(collection(db, "configs"), {
      userId: user.uid,
      configData: configData,
      createdAt: new Date()
    });
    console.log("Konfiguracja zapisana w Firestore!");
  } catch (error) {
    console.error("Błąd zapisu:", error.message);
  }
}

// --- Odczyt konfiguracji z Firestore ---
async function loadConfigs() {
  const user = auth.currentUser;
  if (!user) return [];
  const q = query(collection(db, "configs"), where("userId", "==", user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

// --- IMPORTS ---
import flatpickr from "https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/esm/index.js";
import "https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/l10n/pl.js";
import html2pdf from "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js";

document.addEventListener('DOMContentLoaded', function() {
    // Główny ekran
    document.getElementById('configurator-panel').addEventListener('click', showConfigurator);
    document.getElementById('catalog-panel').addEventListener('click', showCatalog);
    document.getElementById('schedule-panel').addEventListener('click', showSchedule);

    // Nawigacja w konfiguratorze
    document.getElementById('next1').addEventListener('click', () => showStep(2));
    document.getElementById('prev2').addEventListener('click', () => showStep(1));
    document.getElementById('next2').addEventListener('click', () => showStep(3));
    document.getElementById('prev3').addEventListener('click', () => showStep(2));
    document.getElementById('next3').addEventListener('click', () => showStep(4));
    document.getElementById('prev4').addEventListener('click', () => showStep(3));
    document.getElementById('next4').addEventListener('click', () => showStep(5));
    document.getElementById('prev5').addEventListener('click', () => showStep(4));
    document.getElementById('next5').addEventListener('click', () => showStep(6));
    document.getElementById('prev6').addEventListener('click', () => showStep(5));
    document.getElementById('save-event').addEventListener('click', saveEvent);

    // Katalog
    document.getElementById('back-to-main').addEventListener('click', showMain);
    document.getElementById('filter-category').addEventListener('change', filterEvents);

    // Terminarz
    document.getElementById('back-to-main-from-schedule').addEventListener('click', showMain);

    // Konfigurator
    document.getElementById('back-to-main-from-config').addEventListener('click', showMain);

    // Kalendarz
    function initCalendar() {
        if (window.fp) window.fp.destroy();
        const events = JSON.parse(localStorage.getItem('events')) || [];
        const occupiedDates = events.map(e => e.eventDate);
        window.fp = flatpickr("#event-date", {
            dateFormat: "Y-m-d",
            minDate: "today",
            locale: 'pl',
            dateClass: function(date) {
                const dateStr = date.toISOString().split('T')[0];
                return occupiedDates.includes(dateStr) ? 'occupied' : '';
            }
        });
    }

    let scheduleDate = new Date();

    function renderScheduleCalendar(date = new Date()) {
        scheduleDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const events = JSON.parse(localStorage.getItem('events')) || [];
        const occupiedDates = new Set(events.map(e => e.eventDate));
        const monthNames = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
        const dayNames = ['Pn','Wt','Śr','Cz','Pt','So','Nd'];
        const calendar = document.getElementById('schedule-calendar');

        const year = scheduleDate.getFullYear();
        const month = scheduleDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDay = (firstDay.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        calendar.innerHTML = `
            <div class="schedule-header">
                <button class="schedule-nav" id="schedule-prev">&#8249;</button>
                <div class="schedule-title">${monthNames[month]} ${year}</div>
                <button class="schedule-nav" id="schedule-next">&#8250;</button>
            </div>
            <div class="schedule-weekdays">
                ${dayNames.map(name => `<div class="schedule-weekday">${name}</div>`).join('')}
            </div>
            <div class="schedule-grid"></div>
        `;

        const grid = calendar.querySelector('.schedule-grid');
        for (let i = 0; i < startDay; i++) {
            grid.innerHTML += '<div class="schedule-cell empty"></div>';
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const eventForDay = events.find(e => e.eventDate === dateStr);
            const occupied = Boolean(eventForDay);
            let cellContent = `${day}`;
            if (occupied) {
                cellContent += `<div class='event-client-name'>${eventForDay.clientName}</div>`;
            }
            grid.innerHTML += `<div class="schedule-cell ${occupied ? 'occupied' : ''}">${cellContent}</div>`;
        }

        calendar.querySelector('#schedule-prev').addEventListener('click', () => {
            renderScheduleCalendar(new Date(year, month - 1, 1));
        });
        calendar.querySelector('#schedule-next').addEventListener('click', () => {
            renderScheduleCalendar(new Date(year, month + 1, 1));
        });
    }

    initCalendar();

    // Inicjalizacja dań z kategorami
    const dishes = [
        { name: 'Zupa pomidorowa', category: 'zupy' },
        { name: 'Żurek', category: 'zupy' },
        { name: 'Barszcz', category: 'zupy' },
        { name: 'Pierogi', category: 'dania_ciepłe' },
        { name: 'Kotlet schabowy', category: 'dania_ciepłe' },
        { name: 'Łosoś', category: 'dania_ciepłe' },
        { name: 'Tort czekoladowy', category: 'dania_ciepłe' },
        { name: 'Sernik', category: 'dania_ciepłe' },
        { name: 'Owoce', category: 'dania_ciepłe' }
    ];
    let selectedDishes = [];
    let maxDishes = 0;
    let editingEventId = null;

    document.getElementById('num-dishes').addEventListener('change', function() {
        maxDishes = parseInt(this.value) || 0;
        updateDishesList(dishes);
    });

    function updateDishesList(dishes) {
        const list = document.getElementById('dishes-list');
        list.innerHTML = '';
        
        // Grupuj dania po kategoriach
        const categories = {
            'zupy': 'Zupy',
            'dania_ciepłe': 'Dania ciepłe'
        };
        
        for (const [catKey, catLabel] of Object.entries(categories)) {
            const categoryDishes = dishes.filter(d => d.category === catKey);
            
            if (categoryDishes.length > 0) {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'dish-category';
                
                const categoryTitle = document.createElement('h4');
                categoryTitle.textContent = catLabel;
                categoryDiv.appendChild(categoryTitle);
                
                const dishButtonsContainer = document.createElement('div');
                dishButtonsContainer.className = 'dish-buttons-container';
                
                categoryDishes.forEach(dish => {
                    const button = document.createElement('button');
                    button.className = 'dish-button';
                    button.textContent = dish.name;
                    button.type = 'button';
                    
                    // Ustaw wygląd przycisku jeśli danie jest już wybrane
                    if (selectedDishes.includes(dish.name)) {
                        button.classList.add('selected');
                    }
                    
                    button.addEventListener('click', function(e) {
                        e.preventDefault();
                        if (selectedDishes.includes(dish.name)) {
                            selectedDishes = selectedDishes.filter(d => d !== dish.name);
                            button.classList.remove('selected');
                        } else {
                            if (selectedDishes.length < maxDishes) {
                                selectedDishes.push(dish.name);
                                button.classList.add('selected');
                            } else {
                                alert('Możesz wybrać maksymalnie ' + maxDishes + ' dań.');
                            }
                        }
                        updateCalculator();
                    });
                    
                    dishButtonsContainer.appendChild(button);
                });
                
                categoryDiv.appendChild(dishButtonsContainer);
                list.appendChild(categoryDiv);
            }
        }
    }

    // Ceniki dla różnych typów imprez
    const pricingByEventType = {
        'wesele': 40,           // zł za danie
        'chrzciny': 25,         // zł za danie
        'komunia': 25,          // zł za danie
        'bankiet': 35,          // zł za danie
        'okolicznosciowe': 30,  // zł za danie
        'konferencyjna': 20,    // zł za danie
        'stypa': 28             // zł za danie
    };

    // Kalkulator - cena zależy od typu imprezy i ilości dań
    function updateCalculator() {
        const numPeople = parseInt(document.getElementById('num-people').value) || 0;
        const numDishes = parseInt(document.getElementById('num-dishes').value) || 0; // Ilość dań z kroku 3
        const eventType = document.getElementById('event-type').value;
        const wiejskiStol = document.getElementById('wiejski-stol').checked ? 1 : 0;
        
        // Cena za danie zależy od typu imprezy
        const pricePerDish = pricingByEventType[eventType] || 30; // Domyślnie 30 zł
        const priceWiejski = 50; // zł
        
        const pricePerPerson = numDishes * pricePerDish + (wiejskiStol * priceWiejski / numPeople);
        const totalPrice = pricePerPerson * numPeople;
        
        document.getElementById('price-per-person').textContent = pricePerPerson.toFixed(2);
        document.getElementById('total-price').textContent = totalPrice.toFixed(2);
    }

    document.getElementById('num-people').addEventListener('change', updateCalculator);
    document.getElementById('num-dishes').addEventListener('change', updateCalculator);
    document.getElementById('event-type').addEventListener('change', updateCalculator);
    document.getElementById('wiejski-stol').addEventListener('change', updateCalculator);

    function deleteEvent(id) {
        if (confirm('Czy na pewno chcesz usunąć tę imprezę?')) {
            const events = JSON.parse(localStorage.getItem('events')) || [];
            const updatedEvents = events.filter(e => e.id != id);
            localStorage.setItem('events', JSON.stringify(updatedEvents));
            loadEvents();
            initCalendar(); // Aktualizuj kalendarz
            if (document.getElementById('schedule').style.display === 'block') {
                renderScheduleCalendar(scheduleDate);
            }
        }
    }

    function editEvent(id) {
        const events = JSON.parse(localStorage.getItem('events')) || [];
        const event = events.find(e => e.id == id);
        if (event) {
            editingEventId = id;
            document.getElementById('client-name').value = event.clientName;
            document.getElementById('event-type').value = event.eventType;
            document.getElementById('num-people').value = event.numPeople;
            document.getElementById('num-dishes').value = event.numDishes;
            document.getElementById('wiejski-stol').checked = event.wiejskiStol;
            selectedDishes = event.selectedDishes.split(', ').filter(d => d);
            maxDishes = parseInt(event.numDishes);
            updateDishesList(dishes);
            document.getElementById('event-date').value = event.eventDate;
            showConfigurator();
        }
    }

    function showStep(step) {
        for (let i = 1; i <= 6; i++) {
            document.getElementById('step' + i).style.display = i === step ? 'block' : 'none';
        }
    }

    function showConfigurator() {
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('configurator').style.display = 'flex';
        document.getElementById('catalog').style.display = 'none';
        document.getElementById('schedule').style.display = 'none';
        if (!editingEventId) {
            document.getElementById('client-name').value = '';
            document.getElementById('event-type').value = '';
            document.getElementById('num-people').value = '';
            document.getElementById('num-dishes').value = '';
            document.getElementById('wiejski-stol').checked = false;
            selectedDishes = [];
            updateDishesList(dishes);
            document.getElementById('event-date').value = '';
        }
        showStep(1);
    }

    function showCatalog() {
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('configurator').style.display = 'none';
        document.getElementById('catalog').style.display = 'block';
        document.getElementById('schedule').style.display = 'none';
        loadEvents();
    }

    function showSchedule() {
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('configurator').style.display = 'none';
        document.getElementById('catalog').style.display = 'none';
        document.getElementById('schedule').style.display = 'block';
        renderScheduleCalendar();
    }

    function showMain() {
        document.getElementById('main-screen').style.display = 'grid';
        document.getElementById('configurator').style.display = 'none';
        document.getElementById('catalog').style.display = 'none';
        document.getElementById('schedule').style.display = 'none';
        editingEventId = null;
    }

    function saveEvent() {
        const clientName = document.getElementById('client-name').value;
        const eventType = document.getElementById('event-type').value;
        const numPeople = document.getElementById('num-people').value;
        const numDishes = document.getElementById('num-dishes').value;
        const wiejskiStol = document.getElementById('wiejski-stol').checked;
        const selectedDishesStr = selectedDishes.join(', ');
        const eventDate = document.getElementById('event-date').value;

        if (!clientName || !eventType || !numPeople || !eventDate) {
            alert('Wypełnij wszystkie wymagane pola.');
            return;
        }

        const event = {
            id: editingEventId || Date.now(),
            clientName,
            eventType,
            numPeople,
            numDishes,
            wiejskiStol,
            selectedDishes: selectedDishesStr,
            eventDate
        };

        const events = JSON.parse(localStorage.getItem('events')) || [];
        if (editingEventId) {
            const index = events.findIndex(e => e.id == editingEventId);
            if (index !== -1) {
                events[index] = event;
            }
            editingEventId = null;
        } else {
            events.push(event);
        }
        localStorage.setItem('events', JSON.stringify(events));

        alert('Impreza zapisana!');
        initCalendar(); // Aktualizuj kalendarz
        if (document.getElementById('schedule').style.display === 'block') {
            renderScheduleCalendar(scheduleDate);
        }
        showMain();
    }

    function downloadPDF(eventId) {
        const events = JSON.parse(localStorage.getItem('events')) || [];
        const event = events.find(e => e.id == eventId);
        
        if (!event) return;
        
        const eventTypeNames = {
            'wesele': 'Wesele',
            'chrzciny': 'Chrzciny',
            'komunia': 'Komunia Święta',
            'bankiet': 'Bankiet',
            'okolicznosciowe': 'Imprezy Okolicznościowe',
            'konferencyjna': 'Sala Konferencyjna',
            'stypa': 'Stypa'
        };

        const selectedDishesArray = event.selectedDishes.split(', ').filter(d => d);
        
        // Kategoryzuj dania
        const dishesWithCategory = [
            { name: 'Zupa pomidorowa', category: 'zupy' },
            { name: 'Żurek', category: 'zupy' },
            { name: 'Barszcz', category: 'zupy' },
            { name: 'Pierogi', category: 'dania_ciepłe' },
            { name: 'Kotlet schabowy', category: 'dania_ciepłe' },
            { name: 'Łosoś', category: 'dania_ciepłe' },
            { name: 'Tort czekoladowy', category: 'dania_ciepłe' },
            { name: 'Sernik', category: 'dania_ciepłe' },
            { name: 'Owoce', category: 'dania_ciepłe' }
        ];
        
        const selectedWithCategory = selectedDishesArray.map(dishName => {
            const found = dishesWithCategory.find(d => d.name === dishName);
            return found || { name: dishName, category: 'inne' };
        });
        
        // Pogrupuj wybrane dania po kategoriach
        const groupedByCategory = {};
        selectedWithCategory.forEach(dish => {
            if (!groupedByCategory[dish.category]) {
                groupedByCategory[dish.category] = [];
            }
            groupedByCategory[dish.category].push(dish.name);
        });
        
        // Stwórz tabele dla każdej kategorii
        let dishesTableHTML = '';
        const categoryLabels = {
            'zupy': 'Zupy',
            'dania_ciepłe': 'Dania ciepłe',
            'inne': 'Inne'
        };
        
        for (const [catKey, dishList] of Object.entries(groupedByCategory)) {
            dishesTableHTML += `<h4>${categoryLabels[catKey] || catKey}</h4>`;
            dishesTableHTML += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">';
            dishList.forEach(dish => {
                dishesTableHTML += `
                    <tr>
                        <td style="border: 1px solid #333; padding: 8px;">${dish}</td>
                    </tr>
                `;
            });
            dishesTableHTML += '</table>';
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="pl">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { margin: 0; font-size: 20px; }
                    .content { margin: 20px 0; }
                    .field { margin: 10px 0; }
                    .label { font-weight: bold; display: inline-block; width: 200px; }
                    .footer { margin-top: 30px; text-align: right; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Sala Bankietowa Gościniec Zamość</h1>
                </div>
                
                <div class="content">
                    <div class="field">
                        <span class="label">Rodzaj imprezy:</span>
                        <span>${eventTypeNames[event.eventType] || event.eventType}</span>
                    </div>
                    
                    <div class="field">
                        <span class="label">Data imprezy:</span>
                        <span>${event.eventDate}</span>
                    </div>
                    
                    <div class="field">
                        <span class="label">Imię i nazwisko zamawiającego:</span>
                        <span>${event.clientName}</span>
                    </div>
                    
                    <div class="field">
                        <span class="label">Liczba osób:</span>
                        <span>${event.numPeople}</span>
                    </div>
                    
                    <div class="field">
                        <span class="label">Liczba dań:</span>
                        <span>${event.numDishes}</span>
                    </div>
                    
                    <div class="field">
                        <span class="label">Stół wiejski:</span>
                        <span>${event.wiejskiStol ? 'Tak' : 'Nie'}</span>
                    </div>
                    
                    <h3 style="margin-top: 30px;">Wybrane dania:</h3>
                    ${dishesTableHTML}
                </div>
                
                <div class="footer">
                    <p>Data wygenerowania: ${new Date().toLocaleDateString('pl-PL')}</p>
                </div>
            </body>
            </html>
        `;
        
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        
        const opt = {
            margin: 10,
            filename: `Zamowienie_${event.clientName.replace(/\s+/g, '_')}_${event.eventDate}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };
        
        html2pdf().set(opt).from(element).save();
    }

    function loadEvents() {
        const events = JSON.parse(localStorage.getItem('events')) || [];
        const filter = document.getElementById('filter-category').value;
        const list = document.getElementById('events-list');
        list.innerHTML = '';
        events.filter(e => !filter || e.eventType === filter).forEach(event => {
            const div = document.createElement('div');
            div.className = 'event-item';
            div.innerHTML = `
                <h4>${event.clientName} - ${event.eventType}</h4>
                <p>Osób: ${event.numPeople}, Dań: ${event.numDishes}, Stół wiejski: ${event.wiejskiStol ? 'Tak' : 'Nie'}</p>
                <p>Wybrane dania: ${event.selectedDishes}</p>
                <p>Termin: ${event.eventDate}</p>
                <button class="edit-btn" data-id="${event.id}">Edytuj</button>
                <button class="delete-btn" data-id="${event.id}">Usuń</button>
                <button class="download-pdf-btn" data-id="${event.id}">Pobierz PDF</button>
            `;
            list.appendChild(div);
        });

        // Dodaj event listeners dla przycisków
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => editEvent(e.target.dataset.id));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => deleteEvent(e.target.dataset.id));
        });
        document.querySelectorAll('.download-pdf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => downloadPDF(e.target.dataset.id));
        });
    }

    function filterEvents() {
        loadEvents();
    }
});

window.showConfigurator = showConfigurator;
window.showCatalog = showCatalog;
window.showSchedule = showSchedule;