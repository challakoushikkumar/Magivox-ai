document.addEventListener("DOMContentLoaded", function () {
    const signInForm = document.getElementById("signInForm");
    const nameInput = document.getElementById("userName");
    const nameError = document.getElementById("nameError");
    const guestButton = document.getElementById("guestButton");

    if (signInForm && nameInput) {
        const savedName = localStorage.getItem("magivoxUser");

        if (savedName && savedName !== "Guest") {
            nameInput.value = savedName;
        }

        signInForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const cleanName = nameInput.value.trim();

            if (cleanName.length < 2) {
                nameError.textContent = "Please enter at least 2 letters.";
                nameInput.focus();
                return;
            }

            localStorage.setItem("magivoxUser", cleanName);
            localStorage.setItem("magivoxMode", "account");
            window.location.href = "dashboard.html";
        });

        nameInput.addEventListener("input", function () {
            nameError.textContent = "";
        });
    }

    if (guestButton) {
        guestButton.addEventListener("click", function () {
            localStorage.removeItem("magivoxEmail");
            localStorage.removeItem("magivoxPhoto");
            localStorage.setItem("magivoxUser", "Guest");
            localStorage.setItem("magivoxMode", "guest");
        });
    }

    // Profile rendering and logout belong to the Firebase modules.

    const featureSearch = document.getElementById("featureSearch");
    const searchableCards = document.querySelectorAll(".searchable-card");
    const noSearchResults = document.getElementById("noSearchResults");

    if (featureSearch && searchableCards.length > 0) {
        featureSearch.addEventListener("input", function () {
            const searchText = featureSearch.value.trim().toLowerCase();
            let visibleCards = 0;

            searchableCards.forEach(function (card) {
                const isMatch = card.textContent.toLowerCase().includes(searchText);
                card.hidden = !isMatch;
                if (isMatch) visibleCards += 1;
            });

            if (noSearchResults) {
                noSearchResults.hidden = visibleCards !== 0;
            }
        });
    }

    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach(function (link) {
        link.addEventListener("click", function () {
            navLinks.forEach(function (item) {
                item.classList.remove("active");
            });
            link.classList.add("active");
        });
    });
});
