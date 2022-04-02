import * as React from "https://cdn.skypack.dev/react";
import * as ReactDOM from "https://cdn.skypack.dev/react-dom";
import { HashRouter, Routes, Route, NavLink, Link, Navigate } from "https://cdn.skypack.dev/react-router-dom";
import { timesRef } from "./firebase-config.js";
import { query, where, getDocs, addDoc, serverTimestamp, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.4.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.4.1/firebase-auth.js";


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min); // Funktion der genererer et tal mellem to satte værdier
}

function cubeTimer(cubeType, email) {
    const [time, setTime] = React.useState(0);  // State til at sætte tid (timer)
    const [timerOn, setTimerOn] = React.useState(false);  // Holder styr på om timer er i gang
    const [scramble, setScramble] = React.useState(null);   // State til at sætte cube scramble
    const [prevScramble, setPrevScramble] = React.useState(null);  // State der indeholder det sidste scramble
    const [timerState, setTimerState] = React.useState(0);  // Holder styr på hvilket stadie timeren er i
    const [userTimes, setUserTimes] = React.useState([]);  // Indeholder array med tider og tilsvarende scrambles

    React.useEffect(() => {
        if (!timerOn && email !== null && scramble !== null && prevScramble) {
            let timerData = {
                cubeType: cubeType,
                mail: email,
                scramble: prevScramble.toString().replace(/,/g, ""),  // Konverterer prevScramble array til string, og fjerner komma'er med regex
                time: document.querySelector("#cubeTimer").innerText,  // Gemmer tiden (tekst) fra #cubeTimer
                createdAt: serverTimestamp()  // Timestamp når tiden stopper
            }
            async function setData() {
                await addDoc(timesRef, timerData); // Gemmer data til firestore
            }
            setData()
        }

        if (!timerOn && email !== null) {
            async function getData() {
                let queryArray = [];
                const q = query(timesRef,   // Laver en query der tjekker mail, cube type, og sorterer efter kreationstid (maks 10 resultater)
                    where("mail", "==", email),
                    where("cubeType", "==", cubeType),
                    orderBy("createdAt", "desc"),
                    limit(10));
                let querySnapshot = await getDocs(q); // Sender query til firestore
                setUserTimes([]); // Nulstiller userTimes array state
                querySnapshot.forEach((doc) => {
                    queryArray.push([[doc.data().time], [doc.data().scramble]]); // For hvert resultat fra firestore, indsætter vi tid og scramble i array
                });
                setUserTimes(queryArray) // Indsætter array i userTimes state
            }
            getData();  // Kører overstående funktion
        }
    }, [scramble])  // Effect køres hvis scramble opdateres (gemmer/loader informationer når timer stoppes)

    React.useEffect(() => {    // useEffect der opdaterer hvert 10. millisekund (til timeren på siden)
        let interval = null;
        if (timerOn) {
            interval = setInterval(() => {
                setTime(prevTime => prevTime + 10)
            }, 10);
        } else {
            clearInterval(interval);    // Stopper setInterval
        }
        return () => clearInterval(interval);
    }, [timerOn])


    React.useEffect(() => {
        setPrevScramble(scramble);  // Gemmer sidste scramble state i prevScramble state
        if (!timerOn) { // Hvis timeren ikke er i gang
            let scramble = [];  // Deklarerer tomt scramble-array
            let cubeNotation = [];  // Deklarerer tomt array til cube notations
            let cubeNotationMods = [];  // Deklarerer tomt array til cube notation modifiers
            switch (cubeType) {
                case "3x3x3":
                    cubeNotation = ["U", "D", "R", "L", "F", "B"]  // Standard cube notation
                    cubeNotationMods = ["'", "2", ""]  // Standard cube notation modifiers (sidste værdi er tom, så alle 3 har lige stor chance for at blive valgt)
                    for (let i = 0; i < getRandomInt(18, 22); i++) {
                        scramble.push(cubeNotation[getRandomInt(0, cubeNotation.length)]); // Sætter random værdi fra cubeNotation ind i scramble-array
                        while (scramble[i - 1] == scramble[i]) { // Hvis værdien fra før er den samme som værdien før den, reroll indtil en ny er fundet
                            scramble[i] = cubeNotation[getRandomInt(0, cubeNotation.length)] // Dette gøres, så man ikke får fx. L L' - det ville være som at sige + 1 - 1 = 0 -- altså ingen ændring.
                        }
                    }
                    for (let i = 0; i < scramble.length; i++) { // For hver værdi i scramble-array,
                        scramble[i] += cubeNotationMods[getRandomInt(0, cubeNotationMods.length)] + " "; // indsættes der en tilfældig modifier på hver plads.
                    }
                    setScramble(scramble); // Sætter scramble i scramble state
                    break;
                case "5x5x5": // Stort set det samme som overstående, men med lidt flere modifiers (fordi der er flere lag på cube)
                    cubeNotation = ["U", "D", "R", "L", "F", "B"]
                    cubeNotationMods = ["'", "2", "w", "w'", "w2", ""]
                    for (let i = 0; i < getRandomInt(55, 65); i++) {
                        scramble.push(cubeNotation[getRandomInt(0, cubeNotation.length)]);
                        while (scramble[i - 1] == scramble[i]) {
                            scramble[i] = cubeNotation[getRandomInt(0, cubeNotation.length)]
                        }
                    }
                    for (let i = 0; i < scramble.length; i++) {
                        scramble[i] += cubeNotationMods[getRandomInt(0, cubeNotationMods.length)] + " ";
                    }
                    setScramble(scramble);
                    break;
                case "7x7x7": // Næsten det samme som overstående, men med en speciel ny modifier "3" som kan kombineres med andre modifiers
                    cubeNotation = ["U", "D", "R", "L", "F", "B"]
                    cubeNotationMods = ["3", "'", "2", "w", "w'", "w2", ""]
                    for (let i = 0; i < getRandomInt(90, 110); i++) {
                        scramble.push(cubeNotation[getRandomInt(0, cubeNotation.length)]);
                        while (scramble[i - 1] == scramble[i]) {
                            scramble[i] = cubeNotation[getRandomInt(0, cubeNotation.length)]
                        }
                    }
                    for (let i = 0; i < scramble.length; i++) {
                        let specialScramble = getRandomInt(0, cubeNotationMods.length);
                        if (specialScramble == 0) {                                             // Logikken der gør det muligt
                            scramble[i] = cubeNotationMods[specialScramble] + scramble[i];      // at kombinere "3" med andre
                            specialScramble = getRandomInt(0, cubeNotationMods.length)          // modifiers. Det kræver lidt at
                            if (specialScramble != 0) {                                         // man kan løse en 7x7x7 cube for at
                                scramble[i] += cubeNotationMods[specialScramble] + " ";         // forstå logikken! 😆
                            } else {
                                scramble[i] += " ";
                            }
                        } else {
                            scramble[i] += cubeNotationMods[specialScramble] + " ";
                        }
                    }
                    setScramble(scramble);
                    break;
                default:
                    break;
            }
        }
    }, [timerOn]) // Kører hver gang timeren starter/stopper

    React.useEffect(() => {
        switch (timerState) { // En switch-state maskine der holder styr på inputs på spacebar.
            case 0:
                document.addEventListener('keyup', (event) => {
                    event.preventDefault();
                    if (event.key === " ") {
                        document.querySelector("#cubeTimer").style.color = "white"; // Laver timer hvid
                        setTimerOn(true);  // Starter timer
                        setTimerState(1);  // Sender videre til næste state
                        // console.log("Timer started!")
                    }
                }, { once: true })
                break;
            case 1:
                document.addEventListener('keydown', (event) => {
                    event.preventDefault();
                    if (event.key === " ") {
                        document.querySelector("#cubeTimer").style.color = "lightgreen"; // Gør timeren grøn
                        setTimerOn(false);  // Stopper timer
                        setTimerState(2);   // Videre til næste state
                        // console.log("Timer stopped!")
                    }
                }, { once: true })
                break;
            case 2: // Denne state eksisterer kun for at "ignorere" keyup event efter man har stoppet timer med et keydown event
                document.addEventListener('keyup', (event) => {
                    event.preventDefault();
                    if (event.key === " ") {
                        setTimerState(3);  // Sender videre til næste state
                    }
                }, { once: true })
                break;
            case 3:
                document.addEventListener('keydown', (event) => {
                    event.preventDefault();
                    if (event.key === " ") {
                        document.querySelector("#cubeTimer").style.color = "red"; // Gør timeren rød
                        setTime(0); // Nulstiller timer
                        setTimerState(0); // Sender videre til første step
                        // console.log("Timer reset!")
                    }
                }, { once: true })
                break;
            default:
                break;
        }
    }, [timerState]) // Effekt kører når timerState ændres - gør det muligt at hoppe fra step til step med switch

    return (
        <>
            <h2 className="text-center" id="cubeScramble">{scramble}</h2>
            <div className="text-center" id="cubeTimer">
                <span>{("0" + Math.floor((time / 60000) % 60)).slice(-2)}:</span>
                <span>{("0" + Math.floor((time / 1000) % 60)).slice(-2)}.</span>{/* Udregninger for at kunne vise sekunder og minutter */}
                <span>{("0" + ((time / 10) % 100)).slice(-2)}</span>
            </div>
            <div className="d-grid gap-2 col-md-4 col-xs-6 mx-auto">
                {!timerOn && (
                    <button type="button" className="btn btn-success" onClick={() => setTime(0) & setTimerOn(true)}>Start</button> // onClick events så knapper også kan bruges
                )}                      {/* Knapperne fungerer ikke så godt med spacebar state-maskinen, vil gerne prøve at løse problemet i fremtiden når jeg har mere tid */}
                {timerOn && (
                    <button type="button" className="btn btn-danger" onClick={() => setTimerOn(false)}>Stop</button> // onClick events så knapper også kan bruges
                )}                  
                <p className="text-center grey">or hit the spacebar!</p>
            </div>
            {email ? ( // Hvis brugeren er logget ind/har en email sat (kommer længere nede i koden)
                <>
                    <div className="col-lg-8 mx-auto">
                        <table class="table table-dark table-striped table-hover shadow">
                            <thead>
                                <tr>
                                    <th scope="col">Time</th>
                                    <th scope="col">Scramble</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userTimes.map((i) => { // Map hver værdi i userTimes, og returnerer værdier i HTML til tabel
                                    return (
                                        <tr>
                                            <td>{i[0, 0]}</td>
                                            <td>{i[0, 1]}</td>
                                        </tr>)
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : ( // Viser intet hvis brugeren ikke er logget ind. Register today!
                <>

                </>
            )}
        </>
    )
}

function Cube(props) { // Standard cube
    return (
        <>
            <h1 className="text-center">{props.type} scrambler and timer</h1>
            {cubeTimer(props.type, props.email)}
        </>
    );
}

function FiveByFive(props) { // 5x5x5 cube
    return (
        <>
            <h1 className="text-center">{props.type} scrambler and timer</h1>
            {cubeTimer(props.type, props.email)}
        </>
    );
}

function SevenBySeven(props) { // 7x7x7 cube
    return (
        <>
            <h1 className="text-center">{props.type} scrambler and timer</h1>
            {cubeTimer(props.type, props.email)}
        </>
    );
}

function Login(props) { // Login systemet
    const [errorMessage, setErrorMessage] = React.useState(""); // State til at gemme fejl koder i

    function logIn(event) { // Hvis der bliver submittet på form
        event.preventDefault();
        const mail = event.target.mail.value; // Henter email værdi i form
        const password = event.target.password.value; // password værdi i form
        const auth = getAuth(); // Så vi kan kalde getAuth (firebase)
        signInWithEmailAndPassword(auth, mail, password) // Firebase funktion med argumenter vi lige har sat op
            .then(userCredential => {
                // Signed in
                const user = userCredential.user;
            })
            .catch(error => { // Error catch, hvis der skulle være fejl, fx. forkert kode, bruger eksisterer ikke, etc.
                let code = error.code;
                code = code.replaceAll("-", " ");
                code = code.replaceAll("auth/", "");
                setErrorMessage(code);
            });
    }
    return (
        <>
            {props.login ? ( // Hvis man er logget ind bliver der redirectet til forsiden
                <Navigate to="/" />
            ) : (
                <>
                    <h1 className="text-center mb-3">Log in</h1>
                    <div className="col-lg-4 mx-auto">
                        <form onSubmit={logIn}>
                            <div className="mb-2">
                                <input className="form-control" type="email" name="mail" placeholder="Type your e-mail" />
                            </div>
                            <div className="mb-2">
                                <input className="form-control" type="password" name="password" placeholder="Type your password" />
                            </div>
                            <p className="form-text text-white">{errorMessage}</p>{/* Fejlkode indsættes her, hvis der er en */}
                            <button className="btn btn-success mb-2">Log in</button>
                        </form>
                    </div>
                    <p className="text-center">
                        Don't have an account? <Link to="/register">Register now!</Link>
                    </p>
                </>
            )}
        </>
    );
}

function Register(props) { // Samme som overstående, men med "createUserWithEmailAndPassword" firebase funktion i stedet
    const [errorMessage, setErrorMessage] = React.useState("");

    function registerUser(event) {
        event.preventDefault();
        const mail = event.target.mail.value;
        const password = event.target.password.value;
        const auth = getAuth();
        createUserWithEmailAndPassword(auth, mail, password)
            .then(userCredential => {
                // Signed in
                const user = userCredential.user;

            })
            .catch(error => {
                let code = error.code;
                code = code.replaceAll("-", " ");
                code = code.replaceAll("auth/", "");
                setErrorMessage(code);
            });
    }
    return (
        <>
            {props.login ? (
                <Navigate to="/" />
            ) : (
                <>
                    <h1 className="text-center mb-3">Register new user</h1>
                    <div className="col-lg-4 mx-auto">
                        <form onSubmit={registerUser}>
                            <div className="mb-2">
                                <input className="form-control" type="email" name="mail" placeholder="Type your e-mail" />
                            </div>
                            <div className="mb-2">
                                <input className="form-control" type="password" name="password" placeholder="Type your password" />
                            </div>
                            <p className="form-text text-white">{errorMessage}</p>
                            <button className="btn btn-success mb-2">Create user</button>
                        </form>
                    </div>
                </>
            )}
        </>
    );
}

function Logout() {
    const auth = getAuth();
    signOut(auth).then(() => { // Logger brugeren ud med data fra getAuth
        // Sign-out successful.
    })
    return ( // Redirecter brugeren til login siden hvis de manuelt går ind på /logout
        <>
            <Navigate to="/login" />
        </>
    );
}

function PageNotFound() { // Catch-all/404 side, hvis brugeren skulle formå at blive lost
    return (
        <h1 className="text-center">You are not supposed to be here! 👋</h1>
    );
}

function Nav(props) { // Simpel navbar med NavLinks fra react-router-dom
    return (
        <nav className="navbar navbar-expand-md navbar-dark bg-dark shadow">
            <div className="container">
                <Link to="/" className="navbar-brand">
                    <img src="./img/favicon.png" alt="CubeTimer Logo" width="30" className="d-inline-block align-text-top" />
                    &nbsp;CubeTimer
                </Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <NavLink to="/" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                                3x3x3 Cube
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/fivebyfive" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                                5x5x5 Cube
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/sevenbyseven" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                                7x7x7 Cube
                            </NavLink>
                        </li>
                        {props.login ? ( // Ændrer log in knappen til log out hvis brugeren er logget ind
                            <>
                                <li className="nav-item">
                                    <NavLink to="/logout" className={({ isActive }) => (isActive ? "btn btn-outline-danger me-2 active" : "btn btn-outline-danger me-2")}>
                                        Log out
                                    </NavLink>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/login" className={({ isActive }) => (isActive ? "btn btn-outline-success me-2 active" : "btn btn-outline-success me-2")}>
                                        Log in
                                    </NavLink>
                                </li>
                            </>)}
                    </ul>
                </div>
            </div>
        </nav>
    );
}

function App() {
    const auth = getAuth(); // Gemmer firebase auth i auth constant 
    const [isAuth, setIsAuth] = React.useState(localStorage.getItem("isAuth")); // useState til at tjekke om bruger er logget ind
    const [cubeUser, setCubeUser] = React.useState(null);  // useState til at gemme på brugerens email adresse
    onAuthStateChanged(auth, user => {
        if (user) { // Hvis brugeren er logget ind
            setIsAuth(true);
            localStorage.setItem("isAuth", true);
            setCubeUser(user.email);
        } else {    // Hvis brugeren er logget ud
            setIsAuth(false);
            localStorage.removeItem("isAuth");
            setCubeUser(null);
        }
    });
    return (
        <>
            {isAuth ? ( // Hvis brugeren er logget ind, kald <Nav /> med login props, så vi kan ændre knappen til "logud"
                <>
                    <Nav login={isAuth} />
                </>
            ) : ( // Hvis brugeren ikke er logget ind, bare kald <Nav /> normalt (har så en log ind knap)
                <>
                    <Nav />
                </>)}
            <main className="container">
                <Routes>{/* Routes til de forskellige typer cubes, med nødvendige props til funktionalitet */}
                    <Route path="/" element={<Cube type="3x3x3" email={cubeUser} />} />
                    <Route path="/fivebyfive" element={<FiveByFive type="5x5x5" email={cubeUser} />} />
                    <Route path="/sevenbyseven" element={<SevenBySeven type="7x7x7" email={cubeUser} />} />
                    {isAuth ? ( // Routes til login/logout og registering med nødvendige props til funktionalitet
                        <>
                            <Route path="/logout" element={<Logout />} />
                            <Route path="/login" element={<Login login={isAuth} />} />
                            <Route path="/register" element={<Register login={isAuth} />} />
                        </>
                    ) : (
                        <>
                            <Route path="/logout" element={<Logout login={isAuth} />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                        </>
                    )}
                    <Route path="*" element={<PageNotFound />} />{/* Route til catch-all/404-side hvis brugeren skulle blive lost */}
                </Routes>
            </main>
        </>
    );
}

ReactDOM.render( // Renderer --
    <React.StrictMode>
        <HashRouter>
            <App />{/* -- web-appen i -- */}
        </HashRouter>
    </React.StrictMode>,
    document.querySelector("#root") // -- elementet med id="#root"
);