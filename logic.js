let citiesData = [];
let scheduleData = [];

async function fetchCities() {
    try {
        const response = await fetch('https://api.myquran.com/v2/sholat/kota/semua');
        const cities = await response.json();
        citiesData = cities.data;
        populateCities(citiesData);
    } catch (error) {
        console.error("Gagal mengambil data kota:", error);
    }
}

function populateCities(cities) {
    const citySelect = document.getElementById('city');
    citySelect.innerHTML = '';
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.id;
        option.textContent = city.lokasi;
        citySelect.appendChild(option);
    });
}

function filterCities() {
    const searchValue = document.getElementById('searchCity').value.toLowerCase();
    const filteredCities = citiesData.filter(city => city.lokasi.toLowerCase().includes(searchValue));
    populateCities(filteredCities);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';

    const day = date.getDate();
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${year} ${month} ${day}`;
}

function updateFormattedDate(inputId) {
    const inputElement = document.getElementById(inputId);
    const formattedElement = document.getElementById(inputId + 'Formatted');
    if (inputElement.value) {
        formattedElement.value = formatDate(inputElement.value);
    } else {
        formattedElement.value = '';
    }
}

async function fetchSchedule() {
    const citySelect = document.getElementById('city');
    const cityId = citySelect.value;
    const cityName = citySelect.options[citySelect.selectedIndex].text; // Ambil nama kota yang dipilih

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    if (!cityId || !startDate || !endDate) {
        alert('Silakan pilih kota dan rentang tanggal terlebih dahulu.');
        return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const tbody = document.getElementById('schedule');
    tbody.innerHTML = '';
    scheduleData = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        try {
            const response = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`);
            const data = await response.json();
            if (data.status && data.data.jadwal) {
                const schedule = data.data.jadwal;
                const formattedDate = `${year}-${parseInt(month)}-${parseInt(day)}`;
                const row = `
                    <tr>
                        <td>${formattedDate}</td>
                        <td>${schedule.subuh || '-'}</td>
                        <td>${schedule.dzuhur || '-'}</td>
                        <td>${schedule.ashar || '-'}</td>
                        <td>${schedule.maghrib || '-'}</td>
                        <td>${schedule.isya || '-'}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
                
                scheduleData.push([formattedDate, schedule.subuh || '-', schedule.dzuhur || '-', schedule.ashar || '-', schedule.maghrib || '-', schedule.isya || '-']);
            } else {
                tbody.innerHTML += `<tr><td colspan="6">Data tidak tersedia untuk ${year}-${month}-${day}</td></tr>`;
            }
        } catch (error) {
            tbody.innerHTML += `<tr><td colspan="6">Gagal mengambil data untuk ${year}-${month}-${day}</td></tr>`;
        }
    }

    // Set nama kota di tombol download
    document.getElementById('downloadCSV').setAttribute("data-city", cityName);
    document.getElementById('downloadCSV').style.display = 'inline-block';
}

// 🔥 Perubahan: Fungsi untuk mengubah format tanggal ke "YYYY-M-D"
function formatDateCSV(dateStr) {
    return dateStr; // Sudah dalam format "YYYY-M-D"
}

function downloadCSV() {
    const cityName = document.getElementById('downloadCSV').getAttribute("data-city"); // 🔥 Ambil nama kota dari tombol
    let csvContent = "Tanggal;Subuh;Dzuhur;Ashar;Maghrib;Isya\n";

    scheduleData.forEach(row => {
        row[0] = formatDateCSV(row[0]); // 🔥 Ubah format tanggal sebelum disimpan ke CSV
        csvContent += '"' + row.join('";"') + '"\n';
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Jadwal_Adzan_${cityName.replace(/\s+/g, '_')}.csv`); // 🔥 Nama file pakai nama kota
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

fetchCities();
