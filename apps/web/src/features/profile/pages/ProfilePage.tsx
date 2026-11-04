import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Alert } from '../../../components/feedback/Alert.js';
import { Button } from '../../../components/ui/Button.js';
import { useSession } from '../../auth/SessionProvider.js';
import { ApiError } from '../../../lib/http/client.js';
import { browserSession } from '../../../lib/session/session.js';
import { CvPanel } from '../../cv/CvPanel.js';
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
  const [profileError, setProfileError] = useState<string | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState('');
  const [skillsNotice, setSkillsNotice] = useState('');
  const profileErrorRef = useRef<HTMLDivElement>(null);
  const skillsErrorRef = useRef<HTMLDivElement>(null);
  const savingProfile = useRef(false);
  const savingSkills = useRef(false);

  useEffect(() => {
    if (profileError) profileErrorRef.current?.focus();
  }, [profileError]);

  useEffect(() => {
    if (skillsError) skillsErrorRef.current?.focus();
  }, [skillsError]);

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
      setProfileNotice('Perfil guardado.');
      await client.invalidateQueries({ queryKey: profileKey });
    },
    onError: (cause) => setProfileError(message(cause)),
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
      setSkillsNotice('Habilidades guardadas.');
      await Promise.all([
        client.invalidateQueries({ queryKey: skillsKey }),
        client.invalidateQueries({ queryKey: profileKey }),
        client.invalidateQueries({ queryKey: ['analyses', userId] }),
      ]);
    },
    onError: (cause) => setSkillsError(message(cause)),
    onSettled: () => {
      savingSkills.current = false;
    },
  });

  const form = draft ?? (profile.data ? profileDraft(profile.data) : null);
  const selected = selection ?? skills.data?.skillIds ?? [];
  const entries = catalog.data?.pages.flatMap((page) => page.items) ?? [];
  const names = new Map(entries.map((skill) => [skill.id, skill.name]));
  const persistedSkillIds = skills.data?.skillIds ?? [];
  const hasUnsavedSkills =
    selection !== null &&
    (selection.length !== persistedSkillIds.length ||
      selection.some((skillId) => !persistedSkillIds.includes(skillId)));

  return (
    <div className="profile-layout">
      <header className="profile-header">
        <h1>Mi perfil</h1>
        <p className="profile-lead">
          Gestiona tus datos personales y tus habilidades técnicas declaradas. DevPath las utiliza
          para evaluar la compatibilidad con las vacantes que analices.
        </p>
        <div className="profile-next-step surface-soft">
          {selected.length === 0 ? (
            <p>
              <strong>Siguiente paso:</strong> Selecciona tus tecnologías en el catálogo y guarda
              tus habilidades para poder <Link to="/analysis/new">analizar una vacante</Link>. No
              necesitas CV ni proyectos.
            </p>
          ) : (
            <p>
              <strong>Siguiente paso:</strong> Tus tecnologías están listas para comparar. Puedes{' '}
              <Link to="/analysis/new">analizar una vacante</Link> o actualizar tu selección.
            </p>
          )}
        </div>
        <p>
          También puedes <Link to="/profile/projects">gestionar tus proyectos autodeclarados</Link>{' '}
          como parte de tu perfil.
        </p>
      </header>

      <div className="profile-grid">
        {/* Sección: Datos personales y cuenta */}
        <section className="profile-card surface" aria-labelledby="personal-data-title">
          <h2 id="personal-data-title">Datos personales</h2>

          {profile.data && (
            <div className="profile-account-info">
              <span className="profile-account-info__label">Correo:</span>{' '}
              <strong className="profile-account-info__value">{profile.data.email}</strong>
              <span className="badge badge--success">Cuenta activa</span>
            </div>
          )}

          {profileNotice && <Alert variant="success">{profileNotice}</Alert>}

          {profileError && (
            <div ref={profileErrorRef} tabIndex={-1}>
              <Alert variant="error">{profileError}</Alert>
            </div>
          )}

          {profile.isPending && <p role="status">Cargando perfil…</p>}
          {profile.isError && (
            <div className="profile-retry-box">
              <Alert variant="error">{message(profile.error)}</Alert>
              <Button variant="secondary" onClick={() => void profile.refetch()}>
                Reintentar perfil
              </Button>
            </div>
          )}

          {form && (
            <form
              className="profile-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (savingProfile.current) return;
                savingProfile.current = true;
                setProfileError(null);
                setProfileNotice('');
                updateProfile.mutate(form);
              }}
            >
              <label className="field" htmlFor="profile-name">
                <span className="field__label">Nombre</span>
                <input
                  id="profile-name"
                  className="field__input"
                  required
                  maxLength={100}
                  value={form.name}
                  disabled={updateProfile.isPending}
                  onChange={(event) => {
                    setDraft({ ...form, name: event.target.value });
                    setProfileNotice('');
                  }}
                />
              </label>

              <label className="field" htmlFor="profile-headline">
                <span className="field__label">Titular profesional (opcional)</span>
                <input
                  id="profile-headline"
                  className="field__input"
                  maxLength={160}
                  placeholder="Ej. Desarrollador Frontend Junior"
                  value={form.headline}
                  disabled={updateProfile.isPending}
                  onChange={(event) => {
                    setDraft({ ...form, headline: event.target.value });
                    setProfileNotice('');
                  }}
                />
              </label>

              <label className="field" htmlFor="profile-location">
                <span className="field__label">Ubicación (opcional)</span>
                <input
                  id="profile-location"
                  className="field__input"
                  maxLength={120}
                  placeholder="Ej. Madrid, España / Remoto"
                  value={form.location}
                  disabled={updateProfile.isPending}
                  onChange={(event) => {
                    setDraft({ ...form, location: event.target.value });
                    setProfileNotice('');
                  }}
                />
              </label>

              <div className="form-actions">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={updateProfile.isPending}
                  disabled={!form.name.trim()}
                >
                  Guardar perfil
                </Button>
              </div>
            </form>
          )}
        </section>

        <CvPanel userId={userId} />

        {/* Sección: Habilidades técnicas */}
        <section className="profile-card surface" aria-labelledby="skills-title">
          <div className="skills-header">
            <h2 id="skills-title">Mis habilidades</h2>
            {hasUnsavedSkills && <span className="badge badge--warning">Cambios sin guardar</span>}
          </div>

          {skillsNotice && <Alert variant="success">{skillsNotice}</Alert>}

          {skillsError && (
            <div ref={skillsErrorRef} tabIndex={-1}>
              <Alert variant="error">{skillsError}</Alert>
            </div>
          )}

          {skills.isPending && <p role="status">Cargando habilidades…</p>}
          {skills.isError && (
            <div className="skills-retry-box">
              <Alert variant="error">{message(skills.error)}</Alert>
              <Button variant="secondary" onClick={() => void skills.refetch()}>
                Reintentar habilidades
              </Button>
            </div>
          )}

          {skills.data && (
            <>
              <p className="skills-summary">
                <strong>{selected.length}</strong> de 100 seleccionadas. Guarda para aplicar los
                cambios.
              </p>

              {selected.length === 0 ? (
                <p className="skills-empty">
                  Añade tus tecnologías y luego <Link to="/analysis/new">analiza una vacante</Link>.
                  No necesitas CV ni proyectos.
                </p>
              ) : (
                <div className="selected-skills-wrapper">
                  <h3 className="selected-skills-title">Tecnologías seleccionadas</h3>
                  <ul aria-label="Habilidades seleccionadas" className="selected-skills-chips">
                    {selected.map((id) => (
                      <li key={id} className="selected-skill-chip">
                        <span className="selected-skill-chip__name">{names.get(id) ?? id}</span>
                        <Button
                          variant="secondary"
                          className="selected-skill-chip__remove"
                          disabled={updateSkills.isPending}
                          onClick={() => {
                            setSelection(selected.filter((item) => item !== id));
                            setSkillsNotice('');
                          }}
                        >
                          Quitar {names.get(id) ?? id}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="skills-save-bar">
                <Button
                  variant="primary"
                  isLoading={updateSkills.isPending}
                  disabled={!hasUnsavedSkills}
                  onClick={() => {
                    if (savingSkills.current) return;
                    savingSkills.current = true;
                    setSkillsError(null);
                    setSkillsNotice('');
                    updateSkills.mutate(selected);
                  }}
                >
                  Guardar habilidades
                </Button>
              </div>
            </>
          )}

          {/* Buscador de catálogo */}
          <div className="skills-catalog-section">
            <h3 className="skills-catalog-title">Catálogo de tecnologías</h3>
            <form
              className="skills-search-form"
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchInput.trim());
              }}
            >
              <label className="field" htmlFor="search-skill">
                <span className="field__label">Buscar tecnología</span>
                <div className="skills-search-bar">
                  <input
                    id="search-skill"
                    className="field__input"
                    maxLength={80}
                    placeholder="Ej. JavaScript, React, PostgreSQL..."
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                  />
                  <Button type="submit" variant="secondary">
                    Buscar
                  </Button>
                  {search && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setSearchInput('');
                        setSearch('');
                      }}
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
              </label>
            </form>

            {catalog.isPending && <p role="status">Cargando catálogo…</p>}
            {catalog.isError && (
              <div className="catalog-retry-box">
                <Alert variant="error">{message(catalog.error)}</Alert>
                <Button variant="secondary" onClick={() => void catalog.refetch()}>
                  Reintentar catálogo
                </Button>
              </div>
            )}
            {catalog.isSuccess && entries.length === 0 && (
              <p className="skills-empty">No se encontraron tecnologías para esta búsqueda.</p>
            )}

            <ul aria-label="Tecnologías del catálogo" className="catalog-skills-grid">
              {entries.map((skill) => (
                <li key={skill.id}>
                  <label className="profile-skill-option">
                    <input
                      className="profile-skill-option__checkbox"
                      type="checkbox"
                      checked={selected.includes(skill.id)}
                      disabled={
                        !skills.data ||
                        updateSkills.isPending ||
                        (!selected.includes(skill.id) && selected.length >= 100)
                      }
                      onChange={() => {
                        setSelection(toggleSkill(selected, skill.id));
                        setSkillsNotice('');
                      }}
                    />{' '}
                    <span className="profile-skill-option__content">
                      <span className="profile-skill-option__name">{skill.name}</span>
                      {skill.category && (
                        <span aria-hidden="true" className="profile-skill-option__category">
                          {skill.category}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>

            {catalog.hasNextPage && (
              <div className="catalog-more-bar">
                <Button
                  variant="secondary"
                  disabled={catalog.isFetchingNextPage}
                  onClick={() => void catalog.fetchNextPage()}
                >
                  {catalog.isFetchingNextPage ? 'Cargando más…' : 'Más tecnologías'}
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
