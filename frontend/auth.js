document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    if (signupForm) {
        signupForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const firstName = document.getElementById("firstName").value.trim();
            const lastName = document.getElementById("lastName").value.trim();
            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!firstName || !lastName || !username || !email || !password) {
                alert("يرجى ملء جميع الحقول.");
                return;
            }

            try {
                const response = await fetch("/api/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ firstName, lastName, userName: username, email, password }),
                });

                const data = await response.json();
                if (response.ok) {
                    alert(data.message);
                    window.location.href = "sell.html"; // توجيه المستخدم لصفحة تسجيل الدخول
                } else {
                    alert(data.message); // عرض رسالة الخطأ
                }
            } catch (error) {
                alert("حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى لاحقًا.");
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!email || !password) {
                alert("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
                return;
            }

            try {
                const response = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();
                if (response.ok) {
                    alert(data.message);
                    localStorage.setItem("user", JSON.stringify(data.user)); // تخزين بيانات المستخدم
                    window.location.href = "sell.html"; // توجيه المستخدم لصفحة المنتجات
                } else {
                    alert(data.message); // عرض رسالة الخطأ
                }
            } catch (error) {
                alert("حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى لاحقًا.");
            }
        });
    }
});
