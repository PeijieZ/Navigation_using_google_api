// let flightPlanCoordinates = [
//   { lat: 53.4677, lng: -2.2339 },
//   { lat: 53.4673, lng: -2.2346 },
//   { lat: 53.4746, lng: -2.2412 },
//   { lat: 53.4773, lng: -2.2320 },
//   { lat: 53.4774, lng: -2.2311 }
// ];

let flightPlanCoordinates: google.maps.LatLngLiteral[] = [];

function initMap(): void {
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer();
  const map = new google.maps.Map(
    document.getElementById("map") as HTMLElement,
    {
      zoom: 7,
      center: { lat: 41.85, lng: -87.65 },
    }
  );

  directionsRenderer.setMap(map);

  // Load directions from directions.txt
  loadDirections(map);

  const onChangeHandler = function () {
    calculateAndDisplayRoute(directionsService, directionsRenderer);
  };

  (document.getElementById("start") as HTMLElement).addEventListener(
    "change",
    onChangeHandler
  );
  (document.getElementById("end") as HTMLElement).addEventListener(
    "change",
    onChangeHandler
  );

  // Add event listener for the "Draw Route" button
  (document.getElementById("drawRoute") as HTMLElement).addEventListener("click", () => {
    drawRouteFromCoordinates(map);
  });
}

async function loadDirections(map: google.maps.Map): Promise<void> {
  try {
    const response = await fetch('directions.txt');
    const routeText = await response.text();

    // Auto-draw the route
    await parseAndDisplayDirections(map, routeText);
  } catch (error) {
    console.error('Error loading directions:', error);
  }
}

const routeColors: string[] = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  // Add more colors as needed
];

let currentColorIndex = 0;

// Function to get the color for a complete route
function getColorForRoute(): string {
  const color = routeColors[currentColorIndex];
  currentColorIndex = (currentColorIndex + 1) % routeColors.length;
  return color;
}

// Modify the parseAndDisplayDirections function
async function parseAndDisplayDirections(map: google.maps.Map, routeText: string): Promise<void> {
  const regex = /\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/g;
  let match;
  const parsedCoordinates: google.maps.LatLngLiteral[] = [];

  const routeColor = getColorForRoute(); // Get the color for the complete route

  while ((match = regex.exec(routeText)) !== null) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);

    if (!isNaN(lat) && !isNaN(lng)) {
      parsedCoordinates.push({ lat, lng });
    }
  }

  if (parsedCoordinates.length >= 2) {
    await calculateAndDisplayDirections(map, parsedCoordinates, routeColor);
  } else {
    window.alert("At least two valid coordinates are required for directions.");
  }
}

// Modify the calculateAndDisplayDirections function to accept parsed coordinates
async function calculateAndDisplayDirections(
  map: google.maps.Map,
  coordinates: google.maps.LatLngLiteral[],
  routeColor: string
): Promise<void> {
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    map,
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: routeColor,
    },
  });

  const waypoints = coordinates.slice(1, -1).map(coord => ({
    location: new google.maps.LatLng(coord.lat, coord.lng),
    stopover: false,
  }));

  return new Promise<void>((resolve, reject) => {
    directionsService.route(
      {
        origin: coordinates[0],
        destination: coordinates[coordinates.length - 1],
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === 'OK' && response) {
          directionsRenderer.setDirections(response);
          resolve();
        } else {
          window.alert(`Directions request failed due to ${status}`);
          reject();
        }
      }
    );
  });
}

function parseCoordinateString(coordString: string): google.maps.LatLngLiteral | null {
  const match = coordString.match(/\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/);

  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);

    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

function calculateAndDisplayRoute(
  directionsService: google.maps.DirectionsService,
  directionsRenderer: google.maps.DirectionsRenderer
) {
  directionsService
    .route({
      origin: {
        query: (document.getElementById("start") as HTMLInputElement).value,
      },
      destination: {
        query: (document.getElementById("end") as HTMLInputElement).value,
      },
      travelMode: google.maps.TravelMode.DRIVING,
    })
    .then((response) => {
      directionsRenderer.setDirections(response);
    })
    .catch((e) => window.alert("Directions request failed due to " + status));
}

// Function to handle drawing directions from pasted coordinates
async function drawRouteFromCoordinates(map: google.maps.Map): Promise<void> {
  const textarea = document.getElementById("routeCoordinates") as HTMLTextAreaElement;
  const routeText = textarea.value;

  if (routeText.trim() === "") {
    window.alert("Please enter route coordinates in the specified format.");
    return;
  }

  await parseAndDisplayDirections(map, routeText);
}

declare global {
  interface Window {
    initMap: () => void;
  }
}

window.initMap = initMap;
export {};
