import { useQuery } from "@tanstack/react-query";
import { authStore } from "../features/auth/authStore";
import { getCurrentUser } from "../features/profile/profileApi";
import { useI18n } from "../shared/i18n/i18n";
import { ApiErrorMessage } from "../shared/ui/ApiErrorMessage";
import { DataPanel } from "../shared/ui/DataPanel";
import { PageHeader } from "../shared/ui/PageHeader";
import { ScreenState } from "../shared/ui/ScreenState";
import { StatusChip } from "../shared/ui/StatusChip";

export function ProfilePage() {
  const { t } = useI18n();
  const profileQuery = useQuery({
    queryKey: ["current-user", authStore.getToken()],
    queryFn: getCurrentUser
  });

  return (
    <main className="page">
      <DataPanel>
        <PageHeader eyebrow={t("Identity")} title={t("Profile")} subtitle={t("Review account details and role access.")} />
        {profileQuery.isLoading && (
          <ScreenState className="page-subtitle" inline kind="loading" message={t("Loading profile")} />
        )}
        {profileQuery.isError && <ApiErrorMessage error={profileQuery.error} fallback={t("Could not load profile")} />}
        {profileQuery.data && (
          <div className="profile-grid">
            <div>
              <p className="eyebrow">{t("Full name")}</p>
              <strong>{profileQuery.data.fullName}</strong>
            </div>
            <div>
              <p className="eyebrow">{t("Email")}</p>
              <span>{profileQuery.data.email}</span>
            </div>
            <div>
              <p className="eyebrow">{t("Phone")}</p>
              <span>{profileQuery.data.phone}</span>
            </div>
            <div>
              <p className="eyebrow">{t("Roles")}</p>
              <div className="role-list">
                {profileQuery.data.roles.map((role) => (
                  <StatusChip key={role} status={role === "PASSENGER" ? "CONFIRMED" : "SCHEDULED"} label={role} />
                ))}
              </div>
            </div>
          </div>
        )}
      </DataPanel>
    </main>
  );
}
