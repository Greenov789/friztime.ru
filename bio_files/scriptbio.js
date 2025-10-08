// эффект преломления стекла
(function insertLiquidGlassFilterAndToggle() {
  try {
    if (document.getElementById('liquid-glass-filter')) {
      document.querySelectorAll('.gl').forEach(e => e.classList.add('liquid-glass'));
      return;
    }
    const ua = (navigator.userAgent || '').toLowerCase();
    const isChromium = ua.includes('chrome') || ua.includes('edg') || ua.includes('opr') || ua.includes('opera') || ua.includes('chromium');
    const svgText = `
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true">
  <defs>
    <filter id="liquid-glass-filter" x="0%" y="0%" width="100%" height="100%" primitiveUnits="userSpaceOnUse">>
      <feTurbulence type="fractalNoise" baseFrequency="0 0" numOctaves="2" seed="92" result="noise"/>
      <feGaussianBlur in="noise" stdDeviation="2" result="noiseBlur"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="preblur"/>
      <feOffset in="preblur" dx="20" dy="20" result="offsetPreblur"/>
      <feDisplacementMap in="offsetPreblur" in2="noiseBlur" scale="12" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
      <feColorMatrix in="displaced" result="dispR" type="matrix"
        values="1 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 1 0"/>
      <feColorMatrix in="displaced" result="dispG" type="matrix"
        values="0 0 0 0 0
                0 1 0 0 0
                0 0 0 0 0
                0 0 0 1 0"/>
      <feColorMatrix in="displaced" result="dispB" type="matrix"
        values="0 0 0 0 0
                0 0 0 0 0
                0 0 1 0 0
                0 0 0 1 0"/>
      <feBlend in="dispR" in2="dispG" mode="screen" result="blendRG"/>
      <feBlend in="blendRG" in2="dispB" mode="screen" result="blendRGB"/>
      <feGaussianBlur in="blendRGB" stdDeviation="0.5" result="finalBlur"/>
      <feBlend in="SourceGraphic" in2="finalBlur" mode="screen" result="screened"/>
      <feComposite in="screened" in2="SourceGraphic" operator="in" result="comp"/>
      <feComposite in="comp" in2="SourceGraphic" operator="over"/>
    </filter>
  </defs>
</svg>`;

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.width = '0';
    container.style.height = '0';
    container.style.overflow = 'hidden';
    container.style.pointerEvents = 'none';
    container.innerHTML = svgText;
    document.body.appendChild(container);
    try {
      document.querySelectorAll('.gl').forEach(el => {
        el.classList.add('liquid-glass');
      });
    } catch (e) {}
    if (!isChromium) {
      document.documentElement.classList.add('no-liquid-glass-support');
      document.querySelectorAll('.liquid-glass').forEach(el => {
        el.classList.remove('liquid-glass');
        el.classList.add('liquid-glass-fallback');
      });
    }
  } catch (err) {
    console.error('Liquid glass init error:', err);
  }
})();

// API TikTok видео для отображения в рандомном порядке
(function initBackgroundVideo() {
    const video = document.getElementById('bg-video');
    if (!video) return;
    const videoNumber = Math.floor(Math.random() * 12) + 1;
    const videoSrc = `video/video${videoNumber}.mp4`;
    const source = document.createElement('source');
    source.src = videoSrc;
    source.type = 'video/MP4';
    video.appendChild(source);
    video.playsInline = true;
    function tryUnmute() {
        video.muted = false;
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                video.muted = true;
                video.play().catch(e => console.log('Не удалось воспроизвести видео', e));
            });
        }
    }
    tryUnmute();
    function handleFirstInteraction() {
        if (!video) return;
        video.muted = false;
        video.play().catch(e => console.log('Не удалось воспроизвести видео', e));
        window.removeEventListener('click', handleFirstInteraction);
    }

    window.addEventListener('click', handleFirstInteraction, { once: true });
})();

// отображение времени
(function setupClock() {
    const clockElement = document.getElementById('time');
    if (!clockElement) return;

    function updateClock() {
        try {
            const now = new Date();
            const options = {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: 'Europe/Moscow'
            };

            const timeString = new Intl.DateTimeFormat('ru-RU', options).format(now);
            clockElement.textContent = timeString;
        } catch (e) {
            const now = new Date();
            const mskTime = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // +3 часа к UTC

            const hours = String(mskTime.getUTCHours()).padStart(2, '0');
            const minutes = String(mskTime.getUTCMinutes()).padStart(2, '0');
            const seconds = String(mskTime.getUTCSeconds()).padStart(2, '0');

            clockElement.textContent = `${hours}:${minutes}:${seconds}`;
        }
    }
    updateClock();
    setInterval(updateClock, 1000);
})();

// API для отображения погоды в москве
(function fetchWeather() {
    const iconElement = document.getElementById('weather-icon');
    const descElement = document.getElementById('weather-desc');
    const tempElement = document.getElementById('weather-temp');

    if (!iconElement || !descElement || !tempElement) return;

    const apiKey = 'f119bd893befe1a5380ddbb8782e1a2e';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=Moscow&units=metric&appid=${apiKey}&lang=ru`;
    function getWeatherIcon(weatherData) {
        const main = (weatherData && weatherData.main) ? weatherData.main.toLowerCase() : '';

        if (main.includes('clear')) {
            return { class: 'fa-solid fa-sun', className: 'w-sunny' };
        }
        if (main.includes('cloud')) {
            return { class: 'fa-solid fa-cloud', className: 'w-cloud' };
        }
        if (main.includes('rain')) {
            return { class: 'fa-solid fa-cloud-rain', className: 'w-rain' };
        }
        if (main.includes('thunder') || main.includes('storm')) {
            return { class: 'fa-solid fa-bolt', className: 'w-thunder' };
        }
        if (main.includes('snow')) {
            return { class: 'fa-solid fa-snowflake', className: 'w-snow' };
        }
        if (main.includes('mist') || main.includes('fog') || main.includes('haze')) {
            return { class: 'fa-solid fa-smog', className: 'w-fog' };
        }

        return { class: 'fa-solid fa-cloud-sun', className: 'w-cloud' };
    }
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Ошибка сети');
            return response.json();
        })
        .then(data => {
            if (data && data.weather && data.weather[0]) {
                const weather = data.weather[0];
                const iconInfo = getWeatherIcon(weather);

                iconElement.innerHTML = `<i class="${iconInfo.class}"></i>`;
                iconElement.className = 'weather-icon ' + iconInfo.className;

                const temp = Math.round(data.main.temp);
                const description = weather.description[0].toUpperCase() + weather.description.slice(1);

                descElement.textContent = description;
                tempElement.textContent = `${temp}°C`;
            } else {
                showWeatherError();
            }
        })
        .catch(error => {
            console.error('Ошибка при получении погоды:', error);
            showWeatherError();
        });

    function showWeatherError() {
        iconElement.textContent = '❔';
        descElement.textContent = 'Нет данных';
        tempElement.textContent = '--°C';
    }
})();

// получение онлайна лк
(function checkServerStatus() {
    const donutProgress = document.querySelector('.donut-progress');
    const donutText = document.getElementById('server-center');

    if (!donutProgress || !donutText) return;

    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    donutProgress.style.strokeDasharray = `${circumference} ${circumference}`;
    donutProgress.style.strokeDashoffset = circumference;

    const apiUrl = '  https://api.mcstatus.io/v2/status/bedrock/legendcraft.ru  :19132';

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Ошибка сервера');
            return response.json();
        })
        .then(data => {
            const players = data && data.players ? data.players : null;

            if (!players || players.online === undefined) {
                donutText.textContent = '—';
                donutProgress.style.strokeDashoffset = circumference;
                return;
            }

            const online = players.online || 0;
            const max = players.max || 1;
            const percentage = Math.min(1, online / max);
            const offset = circumference - percentage * circumference;

            donutProgress.style.strokeDashoffset = offset;
            donutText.textContent = `${online}`;
        })
        .catch(error => {
            console.error('Ошибка при проверке статуса сервера:', error);
            donutText.textContent = '—';
            donutProgress.style.strokeDashoffset = circumference;
        });
})();
(function setupViewCounter() {
    const counterElement = document.getElementById('views-count');
    const eyeElement = document.getElementById('eye-emoji');

    if (!counterElement) return;

    const storageKey = 'berg_bio_page_views';

    try {
        let views = parseInt(localStorage.getItem(storageKey)) || 0;
        views += 1;
        localStorage.setItem(storageKey, views.toString());
        counterElement.textContent = views.toLocaleString('ru-RU');
    } catch (e) {
        console.error('Не удалось сохранить просмотры:', e);
        counterElement.textContent = '—';
    }
    if (eyeElement) {
        eyeElement.style.transition = 'transform 260ms cubic-bezier(.2,.9,.2,1)';

        setTimeout(() => {
            eyeElement.style.transform = 'translateY(-4px) scale(1.06)';
        }, 260);

        setTimeout(() => {
            eyeElement.style.transform = '';
        }, 780);
    }
})();
