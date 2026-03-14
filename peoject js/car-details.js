 document.addEventListener("DOMContentLoaded", () => {
    updateNav(); 
    const params = new URLSearchParams(window.location.search);
    const carId = params.get('id');

    if (!carId) {
        Swal.fire({
            icon: 'error',
            title: 'შეცდომა',
            text: 'მანქანის ID ვერ მოიძებნა!',
            confirmButtonColor: '#3c0ac7'
        });
        return;
    }

    fetch(`https://rentcar.stepprojects.ge/api/Car/${carId}`).then(res => {
            if (!res.ok) throw new Error("მანქანა ვერ მოიძებნა");
            return res.json();
        })
        .then(car => {
            renderCarDetails(car);
        })
        .catch(err => {
            console.error("Error:", err);
            document.getElementById('carTitle').innerText = "ჩატვირთვის შეცდომა";
        });

    const rentBtn = document.getElementById("rentBtn");
    if (rentBtn) {
        rentBtn.addEventListener("click", () => {
            const priceValue = document.getElementById("carPrice").innerText;
            const price = parseFloat(priceValue.replace(/[^0-9.]/g, ""));
            makePurchase(carId, price);
        });
    }
});

function renderCarDetails(car) {
    updateElement('carTitle', `${car.brand} ${car.model}`);
    updateElement('carPrice', `${car.dailyPrice || car.price} ₾`);
    updateElement('carYear', car.releaseYear || car.year);
    updateElement('carLocation', car.city);
    updateElement('carCapacity', `${car.capacity} კაცი`);
    updateElement('carTrans', car.transmission);
    updateElement('carFuel', `${car.fuelVolume || 0} ლ`);
    updateElement('carOwner', car.userPhone || "არ არის მითითებული");

    const mainImg = document.getElementById('mainImage');
    const mainImgContainer = document.getElementById('mainImgContainer');
    const thumbGroup = document.getElementById('thumbGroup');

    const images = car.carImages || [car.imageUrl1, car.imageUrl2, car.imageUrl3].filter(img => img);

    if (images && images.length > 0) {
        mainImg.src = images[0];
        mainImg.style.display = "block";
        mainImgContainer.classList.remove('loading-placeholder');

        thumbGroup.innerHTML = ''; 
        images.forEach((imgUrl, index) => {
            const img = document.createElement('img');
            img.src = imgUrl;
            img.className = `thumb ${index === 0 ? 'active' : ''}`;
            img.onclick = function () { changeImg(this); };
            thumbGroup.appendChild(img);
        });
    }
    
    document.querySelectorAll('.loading-placeholder').forEach(el => el.classList.remove('loading-placeholder'));
}

async function makePurchase(carId, price) {
    const token = localStorage.getItem("token");

    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'ავტორიზაცია საჭიროა',
            text: 'გთხოვთ გაიაროთ ავტორიზაცია მანქანის დასაჯავშნად',
            showCancelButton: true,
            confirmButtonText: 'შესვლა',
            cancelButtonText: 'გაუქმება',
            confirmButtonColor: '#3c0ac7'
        }).then((result) => {
            if (result.isConfirmed) window.location.href = "login.html";
        });
        return;
    }

    const phoneNumber = getPhoneFromToken(token);
    const btn = document.getElementById("rentBtn");
    const originalText = btn.innerText;
    
    btn.disabled = true;
    btn.innerText = "Processing...";

    try {
        const url = `https://rentcar.stepprojects.ge/Purchase/purchase?phoneNumber=${phoneNumber}&carId=${carId}&multiplier=1`;
        const response = await fetch(url, {
            method: "POST", 
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'წარმატება!',
                text: 'თქვენი ჯავშანი წარმატებით დასრულდა.',
                confirmButtonColor: '#3c0ac7'
            }).then(() => {
                window.location.href = "profile.html";
            });
        } else {
            const errorMsg = await response.text();
            Swal.fire({
                icon: 'error',
                title: 'ვერ მოხერხდა',
                text: 'შეცდომა: ' + errorMsg,
                confirmButtonColor: '#3c0ac7'
            });
        }
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'კავშირის შეცდომა', text: 'სცადეთ თავიდან.', confirmButtonColor: '#3c0ac7' });
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

function updateNav() {
    const authContainer = document.getElementById("auth-buttons");
    if (!authContainer) return;
    const token = localStorage.getItem("token");
    
    if (token) {
        authContainer.innerHTML = `
            <div class="user-profile">
                <a href="profile.html" class="nav-auth-btn">Profile</a>
                <button onclick="logout()" class="nav-auth-btn">Logout</button>
            </div>`;
    } else {
        authContainer.innerHTML = `
            <a href="login.html" class="login-btn">Login</a>
            <a href="register.html" class="btn-primary" style="padding: 10px 20px; font-size: 14px; text-decoration: none;">Register</a>`;
    }
}

window.logout = function() {
    localStorage.removeItem("token");
    window.location.reload();
};

function getPhoneFromToken(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone"];
    } catch (e) { return null; }
}

function changeImg(element) {
    document.getElementById('mainImage').src = element.src;
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = value;
        el.classList.remove('loading-placeholder');
    }
}