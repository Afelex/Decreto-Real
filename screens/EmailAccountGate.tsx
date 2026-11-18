import React from 'react';
import './multiplayer.css';

// Firebase email-link authentication works with Gmail, Outlook, Yahoo and
// other real mail providers. No password or unverified email-as-password.
const firebaseConfig = {
  apiKey: 'AIzaSyA-0H6Ui6g3g34bGXM6TmQ9T_lYWY2bvfE',
  authDomain: 'peruanistas-531e5.firebaseapp.com',
  projectId: 'peruanistas-531e5',
  appId: '1:936991085362:web:46467dfe4312586c70bd2b',
};
const EMAIL_KEY = 'decreto-real.email-link.pending.v1';
const INVITE_KEY = 'decreto-real.email-link.invite.v1';
const RETURN_KEY = 'decreto-real.email-link.return.v1';
function savedInvitation() {
  const fromUrl = new URLSearchParams(window.location.search).get('sala') || '';
  const fromStorage = localStorage.getItem(INVITE_KEY) || '';
  const code = (fromUrl || fromStorage).toUpperCase();
  return /^[0-9]{2}[A-HJ-NP-Z]{2}$/.test(code) ? code : '';
}
function finishEmailLink() {
  const code = savedInvitation();
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(INVITE_KEY);
  const returnTo = localStorage.getItem(RETURN_KEY) === 'cuenta' ? 'cuenta' : 'multijugador';
  localStorage.removeItem(RETURN_KEY);
  window.history.replaceState({}, '', window.location.pathname
    + (code ? '?sala=' + encodeURIComponent(code) : '') + '#/' + (code ? 'multijugador' : returnTo));
}
let sdkPromise: Promise<any> | null = null;
async function sdk() {
  if (!sdkPromise) sdkPromise = (async () => {
    // Keep the existing lean Vite bundle and lockfile unchanged.
    // Firebase serves these version-pinned ESM entrypoints over HTTPS.
    const appUrl = 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
    const authUrl = 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
    const [appApi, authApi] = await Promise.all([
      import(/* @vite-ignore */ appUrl), import(/* @vite-ignore */ authUrl),
    ]);
    const app = appApi.getApps().find((candidate: any) => candidate.name === 'decreto-real-email')
      || appApi.initializeApp(firebaseConfig, 'decreto-real-email');
    return { auth: authApi.getAuth(app), ...authApi };
  })().catch(error => { sdkPromise = null; throw error; });
  return sdkPromise;
}

type Account = {
  uid: string; email: string;
  getToken: () => Promise<string>;
  signOut: () => Promise<void>;
};
const AccountContext = React.createContext<Account | null>(null);
export function useOptionalDuelistAccount(): Account | null {
  return React.useContext(AccountContext);
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && value.trim().length <= 254;
}

export function EmailAccountGate({ children, allowGuest = false }: { children: React.ReactNode; allowGuest?: boolean }) {
  const [user, setUser] = React.useState<any>(null);
  const [guestMode, setGuestMode] = React.useState(false);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'sent' | 'working'>('loading');
  const [email, setEmail] = React.useState('');
  const [linkPending, setLinkPending] = React.useState(false);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    let live = true;
    let unsubscribe: (() => void) | undefined;
    void sdk().then(async api => {
      if (!live) return;
      unsubscribe = api.onAuthStateChanged(api.auth, (next: any) => {
        if (!live) return;
        setUser(next?.emailVerified && next.email ? next : null);
        setStatus('ready');
      }, (err: Error) => { if (live) { setError(err.message); setStatus('ready'); } });
      if (api.isSignInWithEmailLink(api.auth, window.location.href)) {
        if (!live) return;
        setLinkPending(true);
        const remembered = localStorage.getItem(EMAIL_KEY) || '';
        if (validEmail(remembered)) {
          setEmail(remembered);
          try {
            await api.signInWithEmailLink(api.auth, remembered, window.location.href);
            finishEmailLink();
            setLinkPending(false);
          } catch {
            if (live) setError('Escribe el correo al que se envió el enlace para terminar el acceso.');
          }
        }
      }
    }).catch(() => {
      if (live) { setStatus('ready'); setError('No se pudo cargar el acceso seguro. Comprueba tu conexión.'); }
    });
    return () => { live = false; unsubscribe?.(); };
  }, []);

  const signInWithGoogle = async () => {
    setError(''); setStatus('working');
    try {
      const api = await sdk();
      const provider = new api.GoogleAuthProvider();
      try {
        await api.signInWithPopup(api.auth, provider);
      } catch (popupError: any) {
        const code = String(popupError?.code || '');
        if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
          await api.signInWithRedirect(api.auth, provider);
          return;
        }
        throw popupError;
      }
      setStatus('ready');
    } catch (err: any) {
      setStatus('ready');
      const code = String(err?.code || '');
      setError(code === 'auth/operation-not-allowed'
        ? 'El acceso con Google todavía debe habilitarse en Firebase.'
        : code === 'auth/unauthorized-domain'
          ? 'Es necesario autorizar afelex.github.io en Firebase.'
          : code === 'auth/popup-closed-by-user' ? ''
            : 'No se pudo iniciar sesión con Google. Intenta nuevamente.');
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!validEmail(address)) { setError('Introduce un correo electrónico válido.'); return; }
    setError(''); setStatus('working');
    try {
      const api = await sdk();
      if (linkPending) {
        await api.signInWithEmailLink(api.auth, address, window.location.href);
        finishEmailLink();
        setLinkPending(false);
        setStatus('ready');
      } else {
        // This domain must be authorized and Email Link enabled in Firebase Console.
        const code = savedInvitation();
        const returnTo = window.location.hash.startsWith('#/cuenta') && !code ? 'cuenta' : 'multijugador';
        const destination = window.location.origin + import.meta.env.BASE_URL
          + (code ? '?sala=' + encodeURIComponent(code) : '') + '#/' + returnTo;
        await api.sendSignInLinkToEmail(api.auth, address, { url: destination, handleCodeInApp: true });
        localStorage.setItem(EMAIL_KEY, address);
        localStorage.setItem(RETURN_KEY, returnTo);
        if (code) localStorage.setItem(INVITE_KEY, code);
        setStatus('sent');
      }
    } catch (err: any) {
      setStatus('ready');
      const code = String(err?.code || '');
      setError(code === 'auth/operation-not-allowed'
        ? 'El acceso por correo todavía debe habilitarse en Firebase.'
        : code === 'auth/unauthorized-continue-uri'
          ? 'Es necesario autorizar el dominio de Decreto Real en Firebase.'
          : 'No se pudo completar el acceso. Revisa el correo o solicita otro enlace.');
    }
  };

  if (user && status !== 'loading') {
    const account: Account = {
      uid: user.uid,
      email: user.email,
      getToken: () => user.getIdToken(),
      signOut: async () => {
        const api = await sdk();
        await api.signOut(api.auth);
      },
    };
    return <AccountContext.Provider value={account}>{children}</AccountContext.Provider>;
  }
  if (allowGuest && guestMode) return <>{children}</>;
  return <main className="dr-pvp dr-pvp-home">
    <img className="dr-pvp-backdrop" src={import.meta.env.BASE_URL + 'portada/portada-poster.jpg'} alt=""/>
    <div className="dr-pvp-vignette" aria-hidden="true"/>
    <section className="dr-pvp-lobby" aria-label="Acceso al multijugador" style={{ margin: 'auto', zIndex: 1 }}>
      <h1>Tu cuenta de duelista</h1>
      <p>Vincula tu perfil con Google o con un enlace enviado a tu correo. Tus apodos, amistades y estadísticas podrán acompañarte entre dispositivos.</p>
      {status === 'loading' ? <p role="status">Comprobando sesión…</p> : <>
        {status === 'sent' ? <p role="status">Te enviamos un enlace. Abre tu correo y sigue las instrucciones.</p> : null}
        <button type="button" className="dr-pvp-secondary dr-pvp-feature-button"
          onClick={signInWithGoogle} disabled={status === 'working'}>Continuar con Google</button>
        <p style={{ textAlign: 'center', opacity: .8 }}>O utiliza tu correo electrónico</p>
        <form onSubmit={submit} className="dr-pvp-code-join">
          <label>Correo electrónico
            <input type="email" value={email} autoComplete="email" maxLength={254}
              onChange={event => setEmail(event.target.value)} placeholder="nombre@correo.com" required/>
          </label>
          <button className="dr-pvp-primary dr-pvp-feature-button" type="submit"
            disabled={status === 'working'}>
            {status === 'working' ? 'Verificando…' : linkPending ? 'Confirmar mi correo' : 'Enviar enlace de acceso'}
          </button>
        </form>
        {error && <p className="dr-pvp-alert" role="alert">{error}</p>}
        <p className="dr-pvp-tip">Puedes usar Gmail, Outlook, Yahoo o cualquier otro correo que recibas.</p>
      </>}
      {allowGuest && <button type="button" className="dr-pvp-secondary dr-pvp-feature-button"
        onClick={() => setGuestMode(true)}>Continuar como invitado</button>}
      {allowGuest && <p className="dr-pvp-tip">Como invitado puedes jugar sin registrarte. El perfil y los datos sociales no se sincronizan entre dispositivos.</p>}
      <a href={import.meta.env.BASE_URL + '#/'} className="dr-pvp-secondary">Volver al menú principal</a>
    </section>
  </main>;
}
