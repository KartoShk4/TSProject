import {AuthUtils} from "../../utils/auth-utils";
import {HttpUtils} from "../../utils/http-utils";

export class Login {
    constructor(openNewRoute) {
        this.openNewRoute = openNewRoute;

        // Выполняем проверку на наличии токена, если он есть
        if (AuthUtils.getAuthInfo(AuthUtils.accessTokenKey)) {
            // Переводим пользователя на главную страницу
            return openNewRoute('/');
        }

        this.emailElement = document.getElementById('email');
        this.passwordElement = document.getElementById('password');
        this.rememberMeElement = document.getElementById('remember-me');
        this.commonErrorElement = document.getElementById('common-error');

        // Находим текст возможной ошибки при авторизации
        document.getElementById('process-button').addEventListener('click', this.login.bind(this));
    }

    validateForm() {
        let isValid = true;
        if (this.emailElement.value && this.emailElement.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            this.emailElement.classList.remove('is-invalid');
        } else {
            this.emailElement.classList.add('is-invalid');
            isValid = false;
        }
        if (this.passwordElement.value) {
            this.passwordElement.classList.remove('is-invalid');
        } else {
            this.passwordElement.classList.add('is-invalid');
            isValid = false;
        }
        return isValid;
    }

    async login() {
        // Скрываем ошибку в начале авторизации
        this.commonErrorElement.style.display = 'none';
        // Выполняем запрос авторизации
        if (this.validateForm()) {
            const result = await HttpUtils.request('/login', 'POST', false, {
                email: this.emailElement.value,
                password: this.passwordElement.value,
                rememberMe: this.rememberMeElement.checked
            });

            // Делаем проверку на то, есть ли эти данные, если нет то выводим ошибку.
            if (result.error || !result.response || (result.response && (!result.response.tokens.accessToken || !result.response.tokens.refreshToken ||
                !result.response.user || !result.response.user.id || !result.response.user.name || !result.response.user.lastName))) {
                this.commonErrorElement.style.display = 'block';
                return;
            }

            // Повторно скрываем ошибку при успешной авторизации
            this.commonErrorElement.style.display = 'none';

            AuthUtils.setAuthInfo(result.response.tokens.accessToken, result.response.tokens.refreshToken, {
                id: result.response.user.id,
                name: result.response.user.name,
                lastName: result.response.user.lastName
            });

            // После успешной валидации и проверки, переводим пользователя на главную страницу.
            this.openNewRoute('/');
        }
    }
}