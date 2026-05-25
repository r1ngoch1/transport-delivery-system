import { useQuery } from "@tanstack/react-query";
import { authStore } from "../features/auth/authStore";
import { getCurrentUser } from "../features/profile/profileApi";
import { ApiErrorMessage } from "../shared/ui/ApiErrorMessage";
import { ScreenState } from "../shared/ui/ScreenState";
import { StatusChip } from "../shared/ui/StatusChip";

export function ProfilePage() {
  const profileQuery = useQuery({
    queryKey: ["current-user", authStore.getToken()],
    queryFn: getCurrentUser
  });

  return (
    <main className="page">
      <section className="panel content-panel">
        <h1 className="page-title">Profile</h1>
        {profileQuery.isLoading && (
          <ScreenState className="page-subtitle" inline kind="loading" message="Loading profile" />
        )}
        {profileQuery.isError && <ApiErrorMessage error={profileQuery.error} fallback="Could not load profile" />}
        {profileQuery.data && (
          <div className="profile-grid">
            <div>
              <p className="eyebrow">Full name</p>
              <strong>{profileQuery.data.fullName}</strong>
            </div>
            <div>
              <p className="eyebrow">Email</p>
              <span>{profileQuery.data.email}</span>
            </div>
            <div>
              <p className="eyebrow">Phone</p>
              <span>{profileQuery.data.phone}</span>
            </div>
            <div>
              <p className="eyebrow">Roles</p>
              <div className="role-list">
                {profileQuery.data.roles.map((role) => (
                  <StatusChip key={role} status={role === "PASSENGER" ? "CONFIRMED" : "SCHEDULED"} label={role} />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
