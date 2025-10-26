document.addEventListener("DOMContentLoaded", () => {
  // Idioma base
  const defaultLang = "es";
  const savedLang = localStorage.getItem("language") || defaultLang;
  let currentLang = savedLang;

  const translations = {
    es: {
      welcome_title: "Bienvenido - TickECO",
      welcome: "Bienvenido",
      register: "Registrarse",
      login: "Iniciar Sesión",
      register_title: "Registro - TickECO",
      login_title: "Inicio de Sesión - TickECO",
      create_account: "Crear Cuenta",
      full_name: "Nombre Completo",
      email: "Correo Electrónico",
      password: "Contraseña",
      confirm_password: "Confirmar Contraseña",
      register_button: "Registrarse",
      already_have_account: "¿Ya tienes una cuenta?",
      login_here: "Inicia sesión aquí",
      login_heading: "Inicia Sesión",
      login_button: "Iniciar Sesión",
      no_account: "¿No tienes una cuenta?",
      register_here: "Regístrate aquí",
      back_home: "⬅ Volver al Inicio"
    },
    en: {
      welcome_title: "Welcome - TickECO",
      welcome: "Welcome",
      register: "Register",
      login: "Log In",
      register_title: "Register - TickECO",
      login_title: "Login - TickECO",
      create_account: "Create Account",
      full_name: "Full Name",
      email: "Email",
      password: "Password",
      confirm_password: "Confirm Password",
      register_button: "Register",
      already_have_account: "Already have an account?",
      login_here: "Log in here",
      login_heading: "Log In",
      login_button: "Log In",
      no_account: "Don't have an account?",
      register_here: "Register here",
      back_home: "⬅ Back to Home"
    },
    pt: {
      welcome_title: "Bem-vindo - TickECO",
      welcome: "Bem-vindo",
      register: "Registrar-se",
      login: "Entrar",
      register_title: "Registro - TickECO",
      login_title: "Login - TickECO",
      create_account: "Criar Conta",
      full_name: "Nome Completo",
      email: "Email",
      password: "Senha",
      confirm_password: "Confirmar Senha",
      register_button: "Registrar-se",
      already_have_account: "Já tem uma conta?",
      login_here: "Entre aqui",
      login_heading: "Entrar",
      login_button: "Entrar",
      no_account: "Não tem uma conta?",
      register_here: "Registre-se aqui",
      back_home: "⬅ Voltar ao Início"
    }
  };

  // Aplicar traducciones según el idioma actual
  const applyTranslations = () => {
    document.querySelectorAll("[data-translate]").forEach(el => {
      const key = el.getAttribute("data-translate");
      if (translations[currentLang][key]) el.textContent = translations[currentLang][key];
    });

    document.title = translations[currentLang].welcome_title || document.title;
  };

  // Aplicar al cargar
  applyTranslations();

  // Cambiar idioma en index.html
  const langSelector = document.getElementById("language-selector");
  if (langSelector) {
    langSelector.value = currentLang;
    langSelector.addEventListener("change", () => {
      currentLang = langSelector.value;
      localStorage.setItem("language", currentLang);
      applyTranslations();
    });
  }
});
