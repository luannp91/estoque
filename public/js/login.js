// Se já está logado, redireciona direto para o dashboard
if (Auth.logado()) {
    window.location.href = "dashboard.html";
}

// ===================== FORMULÁRIO DE LOGIN =====================
const formLogin = document.getElementById("form-login");

formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = Object.fromEntries(new FormData(e.target).entries());

    try {
        const resp = await api("/auth/login", {
            method: "POST",
            body: JSON.stringify(dados)
        });

        Auth.salvar(resp);
        UI.toast(`Bem-vindo, ${resp.usuario.nome}!`, "sucesso");

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 400);
    } catch (err) {
        UI.toast(err.message, "erro");
    }
});
