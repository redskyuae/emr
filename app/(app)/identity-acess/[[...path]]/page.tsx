import { redirect } from 'next/navigation';

type IdentityAcessRedirectPageProps = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function toQueryString(searchParams: { [key: string]: string | string[] | undefined }) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value) {
      query.set(key, value);
    }
  }

  return query.toString();
}

export default async function IdentityAcessRedirectPage({
  params,
  searchParams,
}: IdentityAcessRedirectPageProps) {
  const [{ path = [] }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const targetPath = path.length ? `/${path.join('/')}` : '/dashboard';
  const queryString = toQueryString(resolvedSearchParams);

  redirect(`/identity-access${targetPath}${queryString ? `?${queryString}` : ''}`);
}
