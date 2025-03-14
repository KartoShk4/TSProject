import {AuthUtils} from "../../utils/auth-utils";
import {HttpUtils} from "../../utils/http-utils";

export class SignUp {
    constructor(openNewRoute) {
        this.openNewRoute = openNewRoute;

        // Выполняем проверку на наличии токена, если он есть
        if (AuthUtils.getAuthInfo(AuthUtils.accessTokenKey)) {
            // Переводим пользователя на главную страницу
            return openNewRoute('/');
        }

        this.fullNameElement = document.getElementById('full-name');
        this.emailElement = document.getElementById('email');
        this.passwordElement = document.getElementById('password');
        this.passwordRepeatElement = document.getElementById('password-repeat');
        this.commonErrorElement = document.getElementById('common-error');

        document.getElementById('process-button').addEventListener('click', this.signUp.bind(this));
    }

    validateForm() {
        // Устанавливаем флаг, форма валидна изначально
        let isValid = true;

        // Проверяем поле ФИО не пустое
        if (this.fullNameElement.value) {
            // Если заполнено поле, удаляем класс
            this.fullNameElement.classList.remove('is-invalid');
        } else {
            // Если пустое, до добавляем класс
            this.fullNameElement.classList.add('is-invalid');
            // Если поле пустое, то меняем флаг
            isValid = false;
        }

        // Проверяем поле e-mail на регулярку
        if (this.emailElement.value && this.emailElement.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            this.emailElement.classList.remove('is-invalid');
        } else {
            this.emailElement.classList.add('is-invalid');
            isValid = false;
        }

        if (this.passwordElement.value && this.passwordElement.value.match(/^(?=.*[A-Z])(?=.*\d).{8,}$/)) {
            this.passwordElement.classList.remove('is-invalid');
        } else {
            this.passwordElement.classList.add('is-invalid');
            isValid = false;
        }

        if (this.passwordRepeatElement.value && this.passwordRepeatElement.value === this.passwordElement.value) {
            this.passwordRepeatElement.classList.remove('is-invalid');
        } else {
            this.passwordRepeatElement.classList.add('is-invalid');
            isValid = false;
        }
        return isValid;
    }

    async signUp(key, value) {
        // Скрываем ошибку в начале авторизации
        this.commonErrorElement.style.display = 'none';
        // Выполняем запрос авторизации
        if (this.validateForm()) {
            const result = await HttpUtils.request('/signup', 'POST', false, {
                name: this.fullNameElement.value.split(' ')[1],
                lastName: this.fullNameElement.value.split(' ')[0],
                email: this.emailElement.value,
                password: this.passwordElement.value,
                passwordRepeat: this.passwordRepeatElement.value,
            });

            if (result.error || !result.response || (result.response && (!result.response.id || !result.response.name))) {
                this.commonErrorElement.style.display = 'block';
            }

            // Сохраняем данные в localStorage
            const userInfo = {
                id: result.response.user.id,
                email: result.response.user.email,
                name: result.response.user.name,
                lastName: result.response.user.lastName
            };


            // Повторно скрываем ошибку при успешной авторизации
            this.commonErrorElement.style.display = 'none';

            localStorage.setItem(AuthUtils.userInfoTokenKey, JSON.stringify(userInfo));

            // После успешной валидации и проверки, переводим пользователя на страницу входа.
            this.openNewRoute('/login');
        }
    }
}