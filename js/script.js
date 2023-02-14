"use strict";

if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
   console.log('this is a touch device');
} else {
   console.log('this is not a touch device');
   document.body.classList.add('no-touch');
}


ymaps.ready(init);

function init() {
   const searchPlaceBtn = document.getElementById('search-place-btn');
   const textField = document.getElementById('suggest');

   const spbCenter = [59.944737, 30.322965];
   const spbRect = [[60.321150, 29.302038], [59.603619, 31.204504]];

   var myMap = new ymaps.Map("map", {
      center: spbCenter,
      controls: [],
      zoom: 12
   }, {
      suppressMapOpenBlock: true,
      yandexMapDisablePoiInteractivity: true
   });


   var HintLayout = ymaps.templateLayoutFactory.createClass("<div class='hint'>" +
      "{{ properties.content }}" +
      "</div>", {
      // Определяем метод getShape, который
      // будет возвращать размеры макета хинта.
      // Это необходимо для того, чтобы хинт автоматически
      // сдвигал позицию при выходе за пределы карты.
      getShape: function () {
         var el = this.getElement(),
            result = null;
         if (el) {
            var firstChild = el.firstChild;
            result = new ymaps.shape.Rectangle(
               new ymaps.geometry.pixel.Rectangle([
                  [0, 0],
                  [firstChild.offsetWidth, firstChild.offsetHeight]
               ])
            );
         }
         return result;
      }
   });


   var BalloonLayout = ymaps.templateLayoutFactory.createClass(
      "<div class=\"balloon hint\">" +
      "<div class=\"content\">$[properties.content]</div>" +
      "<div class=\"close\"></div>" +
      "<div class=\"tail\"></div>" +
      "</div>", {

      build: function () {
         this.constructor.superclass.build.call(this);
         this._$element = $('.balloon', this.getParentElement());
         this.applyElementOffset();
         this._$element.find('.close')
            .on('click', $.proxy(this.onCloseClick, this));
      },

      clear: function () {
         this._$element.find('.close')
            .off('click');
         this.constructor.superclass.clear.call(this);
      },

      onCloseClick: function (e) {
         e.preventDefault();
         this.events.fire('userclose');
      },

      applyElementOffset: function () {
         this._$element.css({
            left: -(this._$element[0].offsetWidth / 2),
            top: -(this._$element[0].offsetHeight + this._$element.find('.tail')[0].offsetHeight)
         });
      },

      getShape: function () {
         if (!this._isElement(this._$element)) {
            return MyBalloonLayout.superclass.getShape.call(this);
         }

         var position = this._$element.position();

         return new ymaps.shape.Rectangle(new ymaps.geometry.pixel.Rectangle([
            [position.left, position.top], [
               position.left + this._$element[0].offsetWidth,
               position.top + this._$element[0].offsetHeight + this._$element.find('.tail')[0].offsetHeight
            ]
         ]));
      },

      _isElement: function (element) {
         return element && element[0] && element.find('.tail')[0];
      },
   });


   const myIcon = {
      iconLayout: 'default#image',
      iconImageHref: 'img/location/map-pin.png',
      iconImageSize: [46, 60],
      iconImageOffset: [-23, -60],
      hintLayout: HintLayout,
      balloonShadow: true,
      balloonLayout: BalloonLayout,
      balloonPanelMaxMapArea: 1
   };

   var myPlacemarks = [
      new ymaps.Placemark([59.963899, 30.300516],
         { content: 'улица Ленина, 33' }, myIcon),

      new ymaps.Placemark([59.985336, 30.348378],
         { content: 'Кантемировская улица, 31' }, myIcon),

      new ymaps.Placemark([59.931544, 30.362545],
         { content: 'Невский проспект, 118' }, myIcon),

      new ymaps.Placemark([59.925232, 30.314709],
         { content: 'Садовая улица, 46' }, myIcon),

      new ymaps.Placemark([59.914592, 30.350911],
         { content: 'Лиговский проспект, 130' }, myIcon),

      new ymaps.Placemark([59.894594, 30.320180],
         { content: 'Московский проспект, 106' }, myIcon),

      new ymaps.Placemark([59.944170, 30.276944],
         { content: '7-я линия Васильевского острова, 60' }, myIcon)
   ];

   var myPlaces = ymaps.geoQuery(myPlacemarks).addToMap(myMap);




   if (document.body.classList.contains('no-touch')) {
      myMap.behaviors.enable('drag');
      myMap.geoObjects.options.set({
         openBalloonOnClick: false
      });

      for (var placemark of myPlacemarks) {
         placemark.events
            .add('mouseenter', function (e) {
               e.get('target').options.set('iconImageHref', 'img/location/map-pin-hovered.png');
            })
            .add('mouseleave', function (e) {
               e.get('target').options.set('iconImageHref', 'img/location/map-pin.png');
            });
      }
   }
   else {
      myMap.behaviors.disable('drag');
      myMap.geoObjects.options.set({
         showHintOnHover: false
      });
   }

   var suggestView = new ymaps.SuggestView('suggest', { boundedBy: spbRect });

   function showAllMap() {
      myMap.setZoom(12);
      myMap.setCenter(spbCenter);
      for (var placemark of myPlacemarks)
         placemark.options.set('iconImageHref', 'img/location/map-pin.png');
   }

   function showNearestStore() {
      showAllMap();

      if (textField.value.trim().length != 0) {
         var searchLocationResults = ymaps.geoQuery(ymaps.geocode(textField.value,
            { results: 1, boundedBy: spbRect, strictBounds: true }))
            // Нужно дождаться ответа от сервера и только потом обрабатывать полученные результаты.
            .then(() => {
               var result = myPlaces.getClosestTo(searchLocationResults.get(0));
               myMap.setCenter(result.geometry.getCoordinates());
               myMap.setZoom(14);

               if (document.body.classList.contains('no-touch'))
                  result.options.set('iconImageHref', 'img/location/map-pin-hovered.png');
               else
                  result.balloon.open();
            }
            );
      }
   }

   textField.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
         e.preventDefault();
         showNearestStore();
      }
   });

   searchPlaceBtn.addEventListener('click', showNearestStore);



   window.addEventListener('resize', function () {
      let windowWidth = document.documentElement.clientWidth;

      if (windowWidth <= 768) { //mobile
         for (var placemark of myPlacemarks)
            placemark.options.set({
               iconImageSize: [34.5, 45], iconImageOffset: [-17.25, -45]
            });
      } else {
         for (var placemark of myPlacemarks)
            placemark.options.set({
               iconImageSize: [46, 60], iconImageOffset: [-23, -60]
            });
      }
   });
}

