import { enhancePasswords, bindPasswordRules, validPassword, PASSWORD_MESSAGE } from './password-policy.js';
import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence

} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyB4-ZNPuaxvrdm1tiRYTtggJGlG9mGnwO8",
  authDomain: "magivox-ai.firebaseapp.com",
  projectId: "magivox-ai",
  storageBucket: "magivox-ai.firebasestorage.app",
  messagingSenderId: "700206195844",
  appId: "1:700206195844:web:a7e8d5640a61df6c84ced1",
  measurementId: "G-X0Q1HHCXJC"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export { app, auth };

enhancePasswords();

let postLoginRedirectStarted = false;

function authErrorMessage(error, provider = "email") {
    const code = error?.code || "";

    if (["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password"].includes(code)) {
        return "Incorrect email or password.";
    }
    if (code === "auth/invalid-email") return "Please enter a valid email address.";
    if (code === "auth/user-disabled") return "This account has been disabled. Please contact MAGIVOX support.";
    if (code === "auth/too-many-requests") return "Too many attempts. Please wait a few minutes, then try again.";
    if (code === "auth/network-request-failed") return "Could not reach Firebase. Check your internet connection and try again.";
    if (code === "auth/operation-not-allowed") {
        return provider === "google"
            ? "Google sign-in is not enabled in Firebase Authentication."
            : "Email/password sign-in is not enabled in Firebase Authentication.";
    }
    if (code === "auth/unauthorized-domain") {
        return `Firebase does not allow sign-in from ${window.location.hostname}. Add this host under Authentication > Settings > Authorized domains.`;
    }
    if (code === "auth/popup-blocked") return "Please allow pop-ups and try again.";
    if (code === "auth/popup-closed-by-user") return "Google login window was closed.";
    if (code === "auth/invalid-api-key") return "The Firebase web configuration is invalid.";

    return `Login failed${code ? ` (${code})` : ""}. Please try again.`;
}

async function redirectAfterLogin(user) {
    if (postLoginRedirectStarted) return;
    postLoginRedirectStarted = true;

    let destination = "dashboard.html";

    try {
        const userReference = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userReference);
        const profile = userSnapshot.exists() ? userSnapshot.data() : null;

        if (!profile || (profile.profileComplete !== true && profile.profileSkipped !== true)) {
            destination = "profile-setup.html";
        }
    } catch (error) {
        // Authentication already succeeded. A temporary profile read failure must
        // not be reported as an invalid login; the dashboard has its own safe
        // profile-loading fallback.
        console.warn("Signed in, but the profile could not be checked:", error);
    }

    window.location.href = destination;
}

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
    prompt: "select_account"
});


const googleButton =
    document.getElementById("googleButton");

const googleError =
    document.getElementById("googleError");

const googleButtonText =
    document.getElementById("googleButtonText");


if (googleButton) {

    googleButton.addEventListener("click", async function () {

        googleButton.disabled = true;

      if (googleButtonText) {
    googleButtonText.textContent =
        "Connecting to Google...";
}

        if (googleError) {
            googleError.textContent = "";
        }

        try {

            await setPersistence(
                auth,
                browserLocalPersistence
            );

            const result = await signInWithPopup(
                auth,
                googleProvider
            );

            const user = result.user;

            localStorage.setItem(
                "magivoxMode",
                "google"
            );

            localStorage.setItem(
                "magivoxUser",
                user.displayName || "MAGIVOX User"
            );

            localStorage.setItem(
                "magivoxEmail",
                user.email || ""
            );

            localStorage.setItem(
                "magivoxPhoto",
                user.photoURL || ""
            );

            await redirectAfterLogin(user);

        } catch (error) {

            console.error(error);

            if (googleError) {
                googleError.textContent = authErrorMessage(error, "google");
            }

        } finally {

            googleButton.disabled = false;

           if (googleButtonText) {
    googleButtonText.textContent =
        "Continue with Google";
}
        }
    });
}


// Dashboard identity is rendered from Firestore by dashboard-data.js.


const logoutButton =
    document.getElementById("logoutButton");

const mobileLogoutButton =
    document.getElementById("mobileLogoutButton");

const logoutButtons =
    [logoutButton, mobileLogoutButton].filter(Boolean);

logoutButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();

            event.stopImmediatePropagation();

            try {
                await signOut(auth);
            } catch (error) {
                console.error(error);
                window.alert("Could not log out. Check your connection and try again.");
                return;
            }

            Object.keys(localStorage)
                .filter((key) => key.startsWith("magivox"))
                .forEach((key) => localStorage.removeItem(key));

            window.location.href = "index.html";
        },
        true
    );
});
// Email and password signup

const emailSignupForm =
    document.getElementById("emailSignupForm");

if (emailSignupForm) {

    const signupName =
        document.getElementById("signupName");

    const signupEmail =
        document.getElementById("signupEmail");

    const signupPassword =
        document.getElementById("signupPassword");

    const confirmPassword =
        document.getElementById("confirmPassword");

    const emailSignupButton =
        document.getElementById("emailSignupButton");

    const emailSignupError =
        document.getElementById("emailSignupError");

    const rules = document.createElement('ul'); rules.id = 'signupPasswordRules'; rules.className = 'password-rules';
    signupPassword.closest('.password-field').after(rules);
    signupPassword.setAttribute('aria-describedby', rules.id);
    const updateSignupRules = bindPasswordRules(signupPassword, rules, confirmPassword, emailSignupButton);
    let signupBusy = false;


    emailSignupForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            if (signupBusy) return;

            const fullName =
                signupName.value.trim();

            const email =
                signupEmail.value.trim();

            const password =
                signupPassword.value;

            const repeatedPassword =
                confirmPassword.value;


            emailSignupError.textContent = "";


            if (fullName.length < 2) {

                emailSignupError.textContent =
                    "Please enter your full name.";

                return;
            }


            if (password !== repeatedPassword) {

                emailSignupError.textContent =
                    "Passwords do not match.";

                return;
            }

            if (!validPassword(password)) { emailSignupError.textContent = PASSWORD_MESSAGE; return; }

            signupBusy = true;
            const signupControls = [...emailSignupForm.querySelectorAll('input,button')];
            signupControls.forEach(control => control.disabled = true);


            emailSignupButton.disabled = true;

            emailSignupButton.textContent =
                "Creating your account...";


            try {

                await setPersistence(
                    auth,
                    browserLocalPersistence
                );


                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                const user = userCredential.user;


                await updateProfile(
                    user,
                    {
                        displayName: fullName
                    }
                );


                localStorage.setItem(
                    "magivoxUser",
                    fullName
                );

                localStorage.setItem(
                    "magivoxEmail",
                    email
                );

                localStorage.setItem(
                    "magivoxMode",
                    "account"
                );


                await redirectAfterLogin(user);

            } catch (error) {

                console.error(error);


                if (
                    error.code ===
                    "auth/email-already-in-use"
                ) {

                    emailSignupError.textContent =
                        "An account already exists with this email.";

                } else if (
                    error.code ===
                    "auth/invalid-email"
                ) {

                    emailSignupError.textContent =
                        "Please enter a valid email address.";

                } else if (
                    error.code ===
                    "auth/weak-password"
                ) {

                    emailSignupError.textContent =
                        PASSWORD_MESSAGE;

                } else {

                    emailSignupError.textContent =
                        "Account creation failed. Please try again.";
                }

            } finally {

                emailSignupButton.disabled = false;

                emailSignupButton.textContent =
                    "Create account";
                signupBusy = false;
                signupControls.forEach(control => control.disabled = false);
                updateSignupRules();
            }
        }
    );
}
// Email and password login

const emailLoginForm =
    document.getElementById("emailLoginForm");

// If Firebase restored a valid session, do not leave the user stranded on the
// login page. This is scoped to login.html because this module is shared by
// other pages for logout and Firebase initialization.
if (emailLoginForm) {
    onAuthStateChanged(auth, (user) => {
        if (user) redirectAfterLogin(user);
    });
}

if (emailLoginForm) {

    const loginEmail =
        document.getElementById("loginEmail");

    const loginPassword =
        document.getElementById("loginPassword");

    const rememberMe =
        document.getElementById("rememberMe");

    const emailLoginButton =
        document.getElementById("emailLoginButton");

    const emailLoginError =
        document.getElementById("emailLoginError");

    const forgotPasswordButton =
        document.getElementById("forgotPasswordButton");


    emailLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                loginEmail.value.trim();

            const password =
                loginPassword.value;


            emailLoginError.style.color =
                "#d83b49";

            emailLoginError.textContent =
                "";

            emailLoginButton.disabled =
                true;

            emailLoginButton.textContent =
                "Logging in...";


            try {

                const selectedPersistence =
                    rememberMe.checked
                        ? browserLocalPersistence
                        : browserSessionPersistence;


                await setPersistence(
                    auth,
                    selectedPersistence
                );


                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                const displayName =
                    user.displayName ||
                    email.split("@")[0];


                localStorage.setItem(
                    "magivoxUser",
                    displayName
                );

                localStorage.setItem(
                    "magivoxEmail",
                    user.email || email
                );

                localStorage.setItem(
                    "magivoxMode",
                    "email"
                );

                await redirectAfterLogin(user);

            } catch (error) {

                console.error(error);
                emailLoginError.textContent = authErrorMessage(error, "email");

            } finally {

                emailLoginButton.disabled =
                    false;

                emailLoginButton.textContent =
                    "Log in";
            }
        }
    );


    // Forgot password

    if (forgotPasswordButton) {

        forgotPasswordButton.addEventListener(
            "click",
            async function () {

                const email =
                    loginEmail.value.trim();


                emailLoginError.style.color =
                    "#d83b49";

                emailLoginError.textContent =
                    "";


                if (!email) {

                    emailLoginError.textContent =
                        "Enter your email address first.";

                    loginEmail.focus();

                    return;
                }


                forgotPasswordButton.disabled =
                    true;

                forgotPasswordButton.textContent =
                    "Sending...";


                try {

                    await sendPasswordResetEmail(
                        auth,
                        email
                    );


                    emailLoginError.style.color =
                        "#1aa56f";

                    emailLoginError.textContent =
                        "Password reset email sent. Check your inbox.";

                } catch (error) {

                    console.error(error);

                    emailLoginError.style.color =
                        "#d83b49";


                    if (
                        error.code ===
                        "auth/invalid-email"
                    ) {

                        emailLoginError.textContent =
                            "Please enter a valid email address.";

                    } else {

                        emailLoginError.textContent =
                            "Could not send reset email. Try again.";
                    }

                } finally {

                    forgotPasswordButton.disabled =
                        false;

                    forgotPasswordButton.textContent =
                        "Forgot password?";
                }
            }
        );
    }
}
