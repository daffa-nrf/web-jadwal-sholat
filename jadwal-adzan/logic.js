let citiesData = [];
let scheduleData = [];

async function fetchCities() {
    const response = await fetch('https://api.myquran.com/v2/sholat/kota/semua');
    const cities = await response.json();
    citiesData = cities.data;
    populateCities(citiesData);
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
    if (isNaN(date.getTime())) return ''; // Jika format tanggal tidak valid
    
    const day = date.getDate();
    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
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
    const cityId = document.getElementById('city').value;
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
    scheduleData = []; // Clear previous schedule data

    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        try {
            const response = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`);
            const data = await response.json();
            if (data.status && data.data.jadwal) {
                const schedule = data.data.jadwal;
                const formattedDate = formatDate(d); // Format tanggal sesuai inputan pengguna
                const row = `
                    <tr>
                        <td>${formattedDate}</td>
                        <td>${schedule.subuh || '-'} </td>
                        <td>${schedule.dzuhur || '-'} </td>
                        <td>${schedule.ashar || '-'} </td>
                        <td>${schedule.maghrib || '-'} </td>
                        <td>${schedule.isya || '-'} </td>
                    </tr>
                `;
                tbody.innerHTML += row;

                // Save data for CSV
                scheduleData.push([formattedDate, schedule.subuh || '-', schedule.dzuhur || '-', schedule.ashar || '-', schedule.maghrib || '-', schedule.isya || '-']);
            } else {
                tbody.innerHTML += `<tr><td colspan="6">Data tidak tersedia untuk ${formatDate(d)}</td></tr>`;
            }
        } catch (error) {
            tbody.innerHTML += `<tr><td colspan="6">Gagal mengambil data untuk ${formatDate(d)}</td></tr>`;
        }
    }

    // Show download button
    document.getElementById('downloadCSV').style.display = 'inline-block';
}

function downloadCSV() {
    const citySelect = document.getElementById('city');
    const selectedCity = citySelect.options[citySelect.selectedIndex].text; // Ambil nama kota yang dipilih
    
    let csvContent = `Kota;${selectedCity}\n`; // Tambahkan nama kota di baris pertama
    csvContent += "Tanggal;Subuh;Dzuhur;Ashar;Maghrib;Isya\n"; // Header kolom
    
    scheduleData.forEach(row => {
        csvContent += '"' + row.join('";"') + '"\n'; // Bungkus setiap nilai dengan kutip
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `jadwal_sholat_${selectedCity.replace(/\s+/g, '_')}.csv`); // Nama file sesuai kota
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

fetchCities();