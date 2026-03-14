let allCars = [];
const carState = {};
let currentPage = 1;
const pageSize = 36;

//** მანქანწბის წამოღება 
async function fetchCars(append = false) {
    let url = `https://rentcar.stepprojects.ge/api/Car/filter?pageIndex=${currentPage}&pageSize=${pageSize}`;

    try {
        const response = await fetch(url);
        const result = await response.json();
        
        if (append) {
            allCars = [...allCars, ...result.data];
        } else {
            allCars = result.data;
        }

        applyLocalFilters();
        
        if (document.getElementById("brandFilter").options.length <= 1) {
            populateBrandFilter(allCars); 
            populateCityFilter(allCars); 
        }

        const loadMoreBtn = document.getElementById("loadMoreBtn");
        if (loadMoreBtn) {
            loadMoreBtn.style.display = result.data.length < pageSize ? "none" : "inline-block";
        }

    } catch (err) {
        console.error("Error fetching cars:", err);
    }
}

document.getElementById("loadMoreBtn")?.addEventListener("click", () => {
    currentPage++;
    fetchCars(true); 
});

function applyLocalFilters() {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const selectedBrand = document.getElementById("brandFilter")?.value || "";
    const selectedCity = document.getElementById("cityFilter")?.value || "";
    
    const minYear = parseInt(document.getElementById("minYear")?.value) || 0;
    const maxYear = parseInt(document.getElementById("maxYear")?.value) || 3000;
    const selectedCapacity = document.getElementById("capacityFilter")?.value || "";
    const sortBy = document.getElementById("sortBy")?.value || "";

    let filteredData = allCars.filter(car => {
        const matchesSearch = !searchTerm || 
            car.brand?.toLowerCase().includes(searchTerm) || 
            car.model?.toLowerCase().includes(searchTerm);
            
        const matchesBrand = !selectedBrand || car.brand === selectedBrand;
        const matchesCity = !selectedCity || car.city === selectedCity;

        const matchesYear = car.year >= minYear && car.year <= maxYear;
        const matchesCapacity = !selectedCapacity || car.capacity == selectedCapacity;

        return matchesSearch && matchesBrand && matchesCity && matchesYear && matchesCapacity;
    });

    if (sortBy === "priceLow") {
        filteredData.sort((a, b) => a.price - b.price);
    } else if (sortBy === "priceHigh") {
        filteredData.sort((a, b) => b.price - a.price);
    } else if (sortBy === "yearNew") {
        filteredData.sort((a, b) => b.year - a.year);
    }

    renderCars(filteredData);
}

function handleFilterChange() {
    currentPage = 1;
    fetchCars(false);
}

document.getElementById("searchInput")?.addEventListener("input", applyLocalFilters);
document.getElementById("brandFilter")?.addEventListener("change", handleFilterChange);
document.getElementById("cityFilter")?.addEventListener("change", handleFilterChange);
document.getElementById("minYear")?.addEventListener("input", applyLocalFilters);
document.getElementById("maxYear")?.addEventListener("input", applyLocalFilters);
document.getElementById("capacityFilter")?.addEventListener("change", applyLocalFilters);
document.getElementById("sortBy")?.addEventListener("change", applyLocalFilters);

fetchCars();

//** 2. მანქანების რენდერი 
function renderCars(data) {
  const row = document.querySelector(".row");
  if (!row) return;
  row.innerHTML = "";

  data.forEach((item) => {
    const carImages = [item.imageUrl1, item.imageUrl2, item.imageUrl3].filter(
      (img) => img && img.trim() !== ""
    );

    const col = document.createElement("div");
    col.className = "car-col";

    const imagesJson = JSON.stringify(carImages).replace(/"/g, '&quot;');

    const carHtml = `
      <div class="car-card">
        <div class="img-container" style="position: relative;">
          <img src="${carImages[0]}" class="car-img" id="img-${item.id}" alt="${item.brand}">
          
          ${carImages.length > 1 ? `
            <button class="slider-btn prev" onclick="event.stopPropagation(); changeImg('${item.id}', ${imagesJson}, -1)">❮</button>
            <button class="slider-btn next" onclick="event.stopPropagation(); changeImg('${item.id}', ${imagesJson}, 1)">❯</button>
          ` : ''}
        </div>
        <div class="car-body">
          <h5>${item.brand} ${item.model || ""} <small>(${item.year})</small></h5>
          <p style="font-size: 0.85rem;">
            City: ${item.city}<br>
            Transmission: ${item.transmission}<br>
            Capacity: ${item.capacity} Persons
          </p>
          <p class="price-text"><b>${item.price} GEL</b></p>
          
          <div style="display: flex; gap: 10px; margin-top: auto;">
             <a href="car-details.html?id=${item.id}" class="btn-outline" style="flex: 1; text-decoration: none; text-align: center; font-size: 14px;">Details</a>
             
             <button class="add-btn" style="flex: 1;" onclick="makePurchase('${item.id}', ${item.price})">Rent</button>
          </div>
        </div>
      </div>
    `;

    col.innerHTML = carHtml;
    row.appendChild(col);
  });
}

//** 3. სურათების გადართვა (სლაიდერი)
window.changeImg = function(carId, images, direction) {
  if (carState[carId] === undefined) carState[carId] = 0;
  carState[carId] += direction;

  if (carState[carId] >= images.length) carState[carId] = 0;
  if (carState[carId] < 0) carState[carId] = images.length - 1;

  const imgElement = document.getElementById(`img-${carId}`);
  if (imgElement) {
    imgElement.src = images[carState[carId]];
  }
};

//** 4. ძებნის ფუნქცია
const searchBar = document.getElementById("searchInput");
if (searchBar) {
  searchBar.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allCars.filter((car) => {
      const brandMatch = car.brand?.toLowerCase().includes(term);
      const modelMatch = car.model?.toLowerCase().includes(term);
      return brandMatch || modelMatch;
    });
    renderCars(filtered);
  });
}

//** 5. ნავიგაციის განახლება (Login/Logout)
function updateNav() {
  const authContainer = document.getElementById("auth-buttons");
  if (!authContainer) return;
  
  const token = localStorage.getItem("token");
  if (token) {
    authContainer.innerHTML = `
        <a href="profile.html" class="btn-outline">Profile</a>
        <button onclick="logout()" class="btn-outline" style="margin-left:10px">Logout</button>
    `;
  } else {
    authContainer.innerHTML = '<a href="login.html" class="btn-outline">Login</a>';
  }
}

//** 6. სისტემიდან გამოსვლა
window.logout = function() {
  localStorage.removeItem("token");
  window.location.reload();
};

//** 7. Rent now ფუნქცია
function getPhoneFromToken(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        
        return payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone"];
    } catch (e) {
        return null;
    }
}
window.makePurchase = async function(carId, price) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("გთხოვთ გაიაროთ ავტორიზაცია!");
        return;
    }

    const phoneNumber = getPhoneFromToken(token);
    const btn = event.target;
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Processing...";

    try {
        const url = `https://rentcar.stepprojects.ge/Purchase/purchase?phoneNumber=${phoneNumber}&carId=${carId}&multiplier=1`;
        const response = await fetch(url, {
            method: "POST", 
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            alert("✅ შესყიდვა წარმატებით დასრულდა!");
        } else {
            alert("❌ ვერ მოხერხდა: " + response.status);
        }
    } catch (err) {
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
};

//** ფილტრის ფუნქცია
function populateBrandFilter(data) {
    const brandSelect = document.getElementById("brandFilter");
    const brands = [...new Set(data.map(car => car.brand))].filter(Boolean);
    brands.forEach(brand => {
        const opt = document.createElement("option");
        opt.value = brand;
        opt.textContent = brand;
        brandSelect.appendChild(opt);
    });
}

function populateCityFilter(data) {
    const citySelect = document.getElementById("cityFilter");
    if (!citySelect) return;
    const cities = [...new Set(data.map(car => car.city))].filter(Boolean);
    cities.forEach(city => {
        const opt = document.createElement("option");
        opt.value = city;
        opt.textContent = city;
        citySelect.appendChild(opt);
    });
}

updateNav();