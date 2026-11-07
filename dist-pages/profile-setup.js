import { app, auth } from "./firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", function () {

    const profileForm = document.querySelector(
        "#profileSetupForm, form"
    );

    const fullNameInput = document.querySelector(
        "#profileFullName, #fullName, [name='fullName']"
    );

    const languageSelect = document.querySelector(
        "#preferredLanguage, #language, [name='language']"
    );

    const experienceSelect = document.querySelector(
        "#experienceLevel, #experience, [name='experience']"
    );

    const roleSelect = document.querySelector(
        "#targetRole, [name='targetRole']"
    );

    const cityInput = document.querySelector(
        "#profileCity, #city, [name='city']"
    );

    const phoneInput = document.querySelector(
        "#profilePhone, #phoneNumber, #phone, [name='phone']"
    );

    const errorMessage = document.querySelector(
        "#profileSetupError, #profileError, .form-error"
    );

    const saveButton =
        document.getElementById("saveProfileButton") ||
        profileForm?.querySelector('button[type="submit"]');

    const setupLaterButton =
        document.getElementById("setUpLaterButton") ||
        document.getElementById("setupLaterButton");

    let currentUser = null;
    let profileAlreadyExists = false;
    const isGuestMode =
        localStorage.getItem("magivoxMode") === "guest";


    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
        } else {
            alert(message);
        }
    }


    if (isGuestMode) {
        let guestProfile = {};

        try {
            guestProfile = JSON.parse(
                localStorage.getItem("magivoxGuestProfile") || "{}"
            );
        } catch (error) {
            console.warn("Guest profile could not be read:", error);
        }

        fullNameInput.value =
            guestProfile.fullName ||
            localStorage.getItem("magivoxUser") ||
            "Guest";
        languageSelect.value =
            guestProfile.preferredLanguage || languageSelect.value;
        experienceSelect.value =
            guestProfile.experienceLevel || experienceSelect.value;
        roleSelect.value =
            guestProfile.targetRole || roleSelect.value;
        cityInput.value = guestProfile.city || "";
        phoneInput.value = guestProfile.phoneNumber || "";
    } else {
        onAuthStateChanged(auth, async function (user) {

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        currentUser = user;

        fullNameInput.value =
            user.displayName ||
            localStorage.getItem("magivoxUser") ||
            "";

        try {
            const userReference = doc(db, "users", user.uid);
            const userSnapshot = await getDoc(userReference);

            if (userSnapshot.exists()) {
                profileAlreadyExists = true;

                const data = userSnapshot.data();

                fullNameInput.value =
                    data.fullName || fullNameInput.value;

                languageSelect.value =
                    data.preferredLanguage || languageSelect.value;

                experienceSelect.value =
                    data.experienceLevel || experienceSelect.value;

                roleSelect.value =
                    data.targetRole || roleSelect.value;

                cityInput.value =
                    data.city || "";

                phoneInput.value =
                    data.phoneNumber || "";
            }

        } catch (error) {
            console.error(error);
            showError("Profile details load avvaledu.");
        }
        });
    }


    profileForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (!currentUser && !isGuestMode) {
            showError("Please login again.");
            return;
        }

        const fullName = fullNameInput.value.trim();
        const preferredLanguage = languageSelect.value;
        const experienceLevel = experienceSelect.value;
        const targetRole = roleSelect.value;
        const city = cityInput.value.trim();
        const phoneNumber = phoneInput.value.trim();

        if (
            !fullName ||
            !preferredLanguage ||
            !experienceLevel ||
            !targetRole ||
            !city
        ) {
            showError("Required details anni fill chey.");
            return;
        }

        if (phoneNumber && !/^[0-9]{10}$/.test(phoneNumber)) {
            showError("Phone number 10 digits undali.");
            return;
        }

        const profileData = {
            uid: currentUser?.uid || "guest",
            fullName: fullName,
            email: currentUser?.email || "",
            preferredLanguage: preferredLanguage,
            experienceLevel: experienceLevel,
            targetRole: targetRole,
            city: city,
            phoneNumber: phoneNumber,
            profileComplete: true,
            updatedAt: serverTimestamp()
        };

        if (!profileAlreadyExists) {
            profileData.createdAt = serverTimestamp();
        }

        try {
            showError("");

            saveButton.disabled = true;
            saveButton.textContent = "Saving...";

            if (isGuestMode) {
                const guestProfile = {
                    fullName,
                    preferredLanguage,
                    experienceLevel,
                    targetRole,
                    city,
                    phoneNumber,
                    profileComplete: true
                };

                localStorage.setItem(
                    "magivoxGuestProfile",
                    JSON.stringify(guestProfile)
                );
                localStorage.setItem("magivoxUser", fullName);
                window.location.href = "dashboard.html";
                return;
            }

            await setDoc(
                doc(db, "users", currentUser.uid),
                profileData,
                { merge: true }
            );

            await updateProfile(currentUser, {
                displayName: fullName
            });

            localStorage.setItem("magivoxUser", fullName);

            localStorage.setItem(
                "magivoxProfile",
                JSON.stringify({
                    fullName,
                    preferredLanguage,
                    experienceLevel,
                    targetRole,
                    city,
                    phoneNumber
                })
            );

            localStorage.setItem(
                "magivoxProfileComplete",
                "true"
            );

            window.location.href = "dashboard.html";

        } catch (error) {
            console.error(error);
            showError("Profile save avvaledu. Please try again.");

            saveButton.disabled = false;
            saveButton.textContent = "Save and continue";
        }
    });


    if (setupLaterButton) {
        setupLaterButton.addEventListener("click", async function () {
            if (setupLaterButton.disabled) return;
            if (isGuestMode) { window.location.href = "dashboard.html"; return; }
            if (!currentUser) { showError("Please wait for your account to load."); return; }
            setupLaterButton.disabled = true;
            try {
                await setDoc(doc(db, "users", currentUser.uid), {
                    profileSkipped: true,
                    updatedAt: serverTimestamp()
                }, { merge: true });
                window.location.href = "dashboard.html";
            } catch {
                showError("Could not save this choice. Please try again.");
                setupLaterButton.disabled = false;
            }
        });
    }

});
