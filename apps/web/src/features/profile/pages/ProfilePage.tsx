import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Alert } from '../../../components/feedback/Alert.js';
import { Button } from '../../../components/ui/Button.js';
import { useSession } from '../../auth/SessionProvider.js';
import { ApiError } from '../../../lib/http/client.js';
import { browserSession } from '../../../lib/session/session.js';
import { loadProfile, profileDraft, saveProfile, type ProfileDraft } from '../api.js';
import { loadSkills, saveSkills, searchSkills, toggleSkill } from '../../skills/api.js';

function message(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'No se pudo conectar. Tus cambios siguen en el formulario; puedes reintentar.';
}
export function ProfilePage() {
  const { session } = useSession();
  return session ? <ProfileEditor key={session.user.id} userId={session.user.id} /> : null;
}
function ProfileEditor({ userId }: { userId: string }) {
  const client = useQueryClient();
  const profileKey = ['profile', userId];
  const skillsKey = ['user-skills', userId];
  const profile = useQuery({
    queryKey: profileKey,
    queryFn: ({ signal }) => loadProfile(signal),
    retry: false,
  });
  const skills = useQuery({
    queryKey: skillsKey,
    queryFn: ({ signal }) => loadSkills(signal),
    retry: false,
  });
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [selection, setSelection] = useState<string[] | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  const savingProfile = useRef(false);
  const savingSkills = useRef(false);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);
  const catalog = useInfiniteQuery({
    queryKey: ['catalog', userId, search],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => searchSkills(search, pageParam, signal),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    retry: false,
  });
  const updateProfile = useMutation({
    mutationFn: saveProfile,
    onSuccess: async (saved) => {
      if (browserSession.snapshot().session?.user.id !== userId) return;
      client.setQueryData(profileKey, saved);
      setDraft(null);
      setNotice('Perfil guardado.');
      await client.invalidateQueries({ queryKey: profileKey });
    },
    onError: (cause) => setError(message(cause)),
    onSettled: () => {
      savingProfile.current = false;
    },
  });
  const updateSkills = useMutation({
    mutationFn: saveSkills,
    onSuccess: async (saved) => {
      if (browserSession.snapshot().session?.user.id !== userId) return;
      client.setQueryData(skillsKey, saved);
      setSelection(null);
      setNotice('Habilidades guardadas.');
      await Promise.all([
        client.invalidateQueries({ queryKey: skillsKey }),
        client.invalidateQueries({ queryKey: profileKey }),
        client.invalidateQueries({ queryKey: ['analyses', userId] }),
      ]);
    },
    onError: (cause) => setError(message(cause)),
    onSettled: () => {
      savingSkills.current = false;
    },
  });
  const form = draft ?? (profile.data ? profileDraft(profile.data) : null);
  const selected = selection ?? skills.data?.skillIds ?? [];
  const entries = catalog.data?.pages.flatMap((page) => page.items) ?? [];
  const names = new Map(entries.map((skill) => [skill.id, skill.name]));
  return (
    <div className="page-form">
      <h1>Mi perfil</h1>
      {error && (
        <div ref={errorRef} tabIndex={-1}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      <p role="status">{notice}</p>
      {profile.isPending && <p role="status">Cargando perfil…</p>}
      {profile.isError && (
        <>
          <Alert variant="error">{message(profile.error)}</Alert>
          <Button onClick={() => void profile.refetch()}>Reintentar perfil</Button>
        </>
      )}
      {form && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (savingProfile.current) return;
            savingProfile.current = true;
            setError(null);
            setNotice('');
            updateProfile.mutate(form);
          }}
        >
          <p>Correo: {profile.data?.email}</p>
          <label className="field">
            Nombre
            <input
              className="field__input"
              required
              maxLength={100}
              value={form.name}
              disabled={updateProfile.isPending}
              onChange={(event) => setDraft({ ...form, name: event.target.value })}
            />
          </label>
          <label className="field">
            Titular profesional (opcional)
            <input
              className="field__input"
              maxLength={160}
              value={form.headline}
              disabled={updateProfile.isPending}
              onChange={(event) => setDraft({ ...form, headline: event.target.value })}
            />
          </label>
          <label className="field">
            Ubicación (opcional)
            <input
              className="field__input"
              maxLength={120}
              value={form.location}
              disabled={updateProfile.isPending}
              onChange={(event) => setDraft({ ...form, location: event.target.value })}
            />
          </label>
          <Button type="submit" isLoading={updateProfile.isPending} disabled={!form.name.trim()}>
            Guardar perfil
          </Button>
        </form>
      )}
      <section aria-labelledby="skills-title">
        <h2 id="skills-title">Mis habilidades</h2>
        {skills.isPending && <p role="status">Cargando habilidades…</p>}
        {skills.isError && (
          <>
            <Alert variant="error">{message(skills.error)}</Alert>
            <Button onClick={() => void skills.refetch()}>Reintentar habilidades</Button>
          </>
        )}
        {skills.data && (
          <>
            <p>{selected.length} de 100 seleccionadas. Guarda para aplicar los cambios.</p>
            {selected.length === 0 ? (
              <p>
                Añade tus tecnologías y luego <Link to="/analysis/new">analiza una vacante</Link>.
                No necesitas CV ni proyectos.
              </p>
            ) : (
              <ul aria-label="Habilidades seleccionadas">
                {selected.map((id) => (
                  <li key={id}>
                    {names.get(id) ?? id}{' '}
                    <Button
                      variant="secondary"
                      disabled={updateSkills.isPending}
                      onClick={() => setSelection(selected.filter((item) => item !== id))}
                    >
                      Quitar {names.get(id) ?? id}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              isLoading={updateSkills.isPending}
              onClick={() => {
                if (savingSkills.current) return;
                savingSkills.current = true;
                setError(null);
                setNotice('');
                updateSkills.mutate(selected);
              }}
            >
              Guardar habilidades
            </Button>
          </>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput.trim());
          }}
        >
          <label className="field">
            Buscar tecnología
            <input
              className="field__input"
              maxLength={80}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>
          <Button type="submit">Buscar</Button>
        </form>
        {catalog.isPending && <p role="status">Cargando catálogo…</p>}
        {catalog.isError && (
          <>
            <Alert variant="error">{message(catalog.error)}</Alert>
            <Button onClick={() => void catalog.refetch()}>Reintentar catálogo</Button>
          </>
        )}
        {catalog.isSuccess && entries.length === 0 && (
          <p>No se encontraron tecnologías para esta búsqueda.</p>
        )}
        <ul aria-label="Tecnologías del catálogo">
          {entries.map((skill) => (
            <li key={skill.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(skill.id)}
                  disabled={
                    !skills.data ||
                    updateSkills.isPending ||
                    (!selected.includes(skill.id) && selected.length >= 100)
                  }
                  onChange={() => setSelection(toggleSkill(selected, skill.id))}
                />{' '}
                {skill.name}
              </label>
            </li>
          ))}
        </ul>
        {catalog.hasNextPage && (
          <Button
            disabled={catalog.isFetchingNextPage}
            onClick={() => void catalog.fetchNextPage()}
          >
            Más tecnologías
          </Button>
        )}
      </section>
    </div>
  );
}
