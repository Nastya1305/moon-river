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
      "{{ properties.hintContent }}" +
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
   }
   );

   const myIcon = {
      iconLayout: 'default#image',
      iconImageHref: 'img/location/map-pin.png',
      iconImageSize: [46, 60],
      iconImageOffset: [-23, -60],
      hintLayout: HintLayout
   };

   var myPlacemarks = [
      new ymaps.Placemark([59.963899, 30.300516],
         { hintContent: 'улица Ленина, 33' }, myIcon),

      new ymaps.Placemark([59.985336, 30.348378],
         { hintContent: 'Кантемировская улица, 31' }, myIcon),

      new ymaps.Placemark([59.931544, 30.362545],
         { hintContent: 'Невский проспект, 118' }, myIcon),

      new ymaps.Placemark([59.925232, 30.314709],
         { hintContent: 'Садовая улица, 46' }, myIcon),

      new ymaps.Placemark([59.914592, 30.350911],
         { hintContent: 'Лиговский проспект, 130' }, myIcon),

      new ymaps.Placemark([59.894594, 30.320180],
         { hintContent: 'Московский проспект, 106' }, myIcon),

      new ymaps.Placemark([59.944170, 30.276944],
         { hintContent: '7-я линия Васильевского острова, 60' }, myIcon)
   ];

   var myPlaces = ymaps.geoQuery(myPlacemarks).addToMap(myMap);

   for (var placemark of myPlacemarks) {
      placemark.events
         .add('mouseenter', function (e) {
            e.get('target').options.set('iconImageHref', 'img/location/map-pin-hovered.png');
         })
         .add('mouseleave', function (e) {
            e.get('target').options.set('iconImageHref', 'img/location/map-pin.png');
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

               result.options.set('iconImageHref', 'img/location/map-pin-hovered.png');
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
      if (windowWidth <= 1140)  //tablet, mobile
         myMap.behaviors.disable('drag');
      else
         myMap.behaviors.enable('drag');

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

