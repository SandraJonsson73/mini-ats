# Mini-ATS

Ett litet applicant tracking system (ATS) för rekryterare och deras kunder. Kunder lägger upp jobb och kandidater och följer dem i en kanban-vy. Admin skapar konton och kan göra allt åt kunderna. Kandidaters CV kan bedömas med hjälp av AI.

**Live:** <https://mini-ats-theta-gray.vercel.app/login>

## Funktioner

### Konton och roller

- Admin skapar admin- och kundkonton (ingen publik registrering). Kunder tillhör en organisation och delar jobb och kandidater med övriga i samma organisation.
- Inloggning med e-post och lösenord. Användare kan byta lösenord under *Konto*.
- Admin växlar mellan kundorganisationer i en rullgardin och kan göra allt en kund kan göra.
- Admin kan ta bort konton (organisationens data påverkas inte)

### Rekrytering

- Jobb: skapa, stänga och öppna igen.
- Kandidater: namn, e-post, telefon, LinkedIn-länk, anteckningar och CV (PDF). Redigera och ta bort.
- Kompakt kanban med sex steg (Ny, Screening, Intervju, Erbjudande, Anställd, Avslutad). Drag and drop mellan stegen sparas direkt.
- Filter på jobb och kandidatnamn. Filtret ligger i URL:en, så en filtrerad vy går att dela.

### AI-bedömning av CV (extra)

- Knappen *Bedöm CV* skickar CV:t och jobbeskrivningen till Claude och sparar en strukturerad bedömning: poäng 1-10, säkerhetsnivå, sammanfattning, styrkor, luckor och förslag på intervjufrågor. Poängen visas som märke på kanban-kortet.

## Teknik

| Del | Val |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Data och formulär | TanStack Query, React Router, react-hook-form, zod |
| Drag and drop | dnd-kit |
| Backend | Supabase: Auth, Postgres (med RLS), Storage, Edge Functions (Deno) |
| AI | Claude via Anthropics API (`claude-sonnet-5-5`), anropas från en edge function |
| Hosting | Vercel (frontend), Supabase (backend) |

## Arkitektur och säkerhet

```text
Webbläsare (React)
   │  anon-nyckel + användarens inloggning
   ├──► Supabase Postgres  (RLS avgör vilka rader användaren ser)
   ├──► Supabase Storage   (privat bucket "cvs", policy per organisation)
   └──► Edge Functions
          ├─ admin-create-user  (kräver admin, använder service role-nyckeln)
          └─ score-candidate    (läser CV som användaren, anropar Claude)
```

- **Åtkomst sköts i databasen, inte i frontend-koden.** Row Level Security-policyer på `organizations`, `profiles`, `jobs` och `candidates` ger kunder åtkomst till sin egen organisation och admin åtkomst till allt. En kompositnyckel (`job_id`, `organization_id`) hindrar att en kandidat kopplas till ett jobb i en annan organisation.
- **CV-filer** ligger i en privat bucket under `{organization_id}/{candidate_id}.pdf`. Storage-policyn jämför första mappnamnet med användarens organisation. Nedladdning sker via tillfälliga signerade länkar (60 sekunder).
- **Hemligheter:** `service_role`-nyckeln och `ANTHROPIC_API_KEY` finns bara som hemligheter i Supabase och når aldrig webbläsaren. Frontend använder bara den publika anon-nyckeln.
- **`admin-create-user`** kontrollerar att anroparen är admin (via `is_admin()` i databasen) innan den skapar användaren, och ångrar halvfärdiga konton om något steg misslyckas.
- **`score-candidate`** hämtar kandidat, jobb och CV med anroparens egen inloggning. RLS och Storage-policyn avgör därför åtkomsten, och en kund kan inte bedöma en annan kunds kandidat.

## AI-bedömningen: hur den är tänkt att användas

- Bedömningen är **beslutsstöd, aldrig ett beslut.** Instruktionen till modellen förbjuder att den rekommenderar att någon avvisas eller anställs.
- Bedömningen utgår **bara från jobbets krav**. Modellen instrueras att inte väga in eller kommentera skyddade egenskaper som kön, ålder, nationalitet eller foto, och att sänka sin säkerhetsnivå när CV:t saknar underlag.
- CV:t behandlas som **data, inte instruktioner**, som skydd mot text i filen som försöker styra modellen.
- Svaret tvingas till ett **fast JSON-schema** (structured outputs), så att det går att visa och sortera. Poängen begränsas till 1-10 i koden.
- Varje bedömning sparas med **modell och promptversion**, så att resultat kan jämföras när instruktionen ändras. En bedömning rensas när CV:t byts eller kandidaten flyttas till ett annat jobb.

## Kör lokalt

Krav: Node.js 20+ och ett Supabase-projekt.

```bash
npm install
cp .env.example .env.local   # fyll i VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY
npm run dev
```

`npm run build` bygger för produktion och `npm run lint` kör ESLint.

## Sätta upp backend

1. Skapa ett Supabase-projekt.
2. Kör filerna i `supabase/migrations/` i ordning (0001, 0002, 0003) i SQL Editor, eller med `npx supabase db push` efter `npx supabase link`.
3. Spara hemligheten för AI-funktionen: `npx supabase secrets set ANTHROPIC_API_KEY=...`
4. Deploya funktionerna:

   ```bash
   npx supabase functions deploy admin-create-user
   npx supabase functions deploy score-candidate
   ```

5. **Skapa första admin.** Skapa en användare under *Authentication → Users* (med *Auto Confirm User*) och kör sedan i SQL Editor:

   ```sql
   insert into public.profiles (id, email, full_name, role)
   select id, email, 'Admin', 'admin' from auth.users where email = 'din@epost.se';
   ```

   Därefter skapas alla övriga konton i appen under *Användare*.

## Publicera frontend

Importera repot i Vercel (Vite-förinställning) och lägg in `VITE_SUPABASE_URL` och `VITE_SUPABASE_ANON_KEY` som miljövariabler. `vercel.json` skickar alla adresser till `index.html` så att routing fungerar vid omladdning. Varje push till `main` publiceras automatiskt.

## Antaganden

- Inga konton skapas av användarna själva. Admin skapar dem och delar ett engångslösenord, som användaren byter under *Konto*.
- En kund är en organisation med en eller flera användare. Alla användare i organisationen ser samma jobb och kandidater.
- Rekryteringsprocessen har samma sex fasta steg för alla.
- En kandidat hör till ett jobb. Samma person som söker två jobb registreras två gånger.
- CV:n är PDF-filer på högst 5 MB.
- Nya och flyttade kandidater hamnar sist i sin kolumn. Ordningen inom en kolumn går inte att ändra med drag and drop.

## Kända begränsningar och nästa steg

### Före skarp drift med riktiga kandidatdata

- **GDPR.** Kandidaternas CV skickas till Anthropic för bedömning. I skarp drift krävs personuppgiftsbiträdesavtal, information till kandidaterna, en gallringsrutin och en rutin för radering på begäran.
- **Inbjudan via e-post och återställning av glömt lösenord.** Idag delas ett engångslösenord manuellt.
- **Skärpt åtkomst till edge functions.** Funktionerna kontrollerar själva att anroparen är inloggad (och admin för `admin-create-user`), men `verify_jwt` är avstängt på gatewayen och CORS är öppet. Båda bör stramas åt.
- **Begränsning av AI-anrop** per användare och organisation, så att kostnaden inte kan skenas iväg.

## Produktidéer

- Sortera om kandidater inom en kolumn, stegbyten med historik och notiser.
- Eget kanban-flöde per kund och jobb.
- AI: rangordna alla kandidater för ett jobb, ett eval-set med manuellt betygsatta CV för att mäta kvalitet, och jämförelse mellan promptversioner.
- Automatiska tester, särskilt av RLS-policyerna.
