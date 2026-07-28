"use client";

import React from "react";
import Link from "next/link";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-3xl px-6 py-16 mx-auto">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          Cookie Policy
        </h1>
        <p className="mb-10 text-sm text-gray-500 dark:text-gray-400">
          Last updated: March 5, 2026
        </p>

        <div className="space-y-8 text-gray-700 dark:text-gray-300">
          {/* Introduction */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              1. Introduction
            </h2>
            <p>
              Easy-Coop (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) uses
              cookies and similar local storage technologies on{" "}
              <strong>easy-coop.de</strong> (the &quot;Platform&quot;) to
              operate core functionality and improve your experience. This
              policy explains what data is stored, why, and how you can manage
              it.
            </p>
          </section>

          {/* What are cookies */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              2. What Are Cookies &amp; Local Storage?
            </h2>
            <p>
              <strong>Cookies</strong> are small text files placed on your
              device by your browser when you visit a website. They are sent
              back to the server with each subsequent request.
            </p>
            <p className="mt-2">
              <strong>Local Storage</strong> is a browser mechanism that allows
              websites to store key-value data on your device. Unlike cookies,
              local storage data is not sent to the server automatically.
            </p>
          </section>

          {/* Cookies we use */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              3. Cookies &amp; Storage We Use
            </h2>
            <p className="mb-4">
              We do <strong>not</strong> use any third-party analytics,
              advertising, or tracking cookies. All data stored is strictly
              necessary for the Platform to function.
            </p>

            {/* Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg dark:border-slate-700">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      Name
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      Type
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      Purpose
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">
                      appwrite-session
                    </td>
                    <td className="px-4 py-3">HTTP-only Cookie</td>
                    <td className="px-4 py-3">
                      Stores your authenticated session token so you remain
                      logged in across page loads. Contains your session
                      credential and user ID. Marked <em>HttpOnly</em> so it
                      cannot be read by client-side scripts.
                    </td>
                    <td className="px-4 py-3">7 days</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">theme</td>
                    <td className="px-4 py-3">Local Storage</td>
                    <td className="px-4 py-3">
                      Remembers your preferred color theme (light or dark) so
                      it persists between visits.
                    </td>
                    <td className="px-4 py-3">Persistent</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">
                      appwriteUserMap
                    </td>
                    <td className="px-4 py-3">Local Storage</td>
                    <td className="px-4 py-3">
                      Caches user directory data locally to reduce repeated
                      server requests and improve page load performance.
                    </td>
                    <td className="px-4 py-3">Session-based</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs">
                      appwriteCoopMap
                    </td>
                    <td className="px-4 py-3">Local Storage</td>
                    <td className="px-4 py-3">
                      Caches cooperative data locally to reduce repeated server
                      requests and improve page load performance.
                    </td>
                    <td className="px-4 py-3">Session-based</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Categories */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              4. Cookie Categories
            </h2>
            <p>
              All cookies and local storage used on this Platform fall under the
              category of <strong>strictly necessary</strong> or{" "}
              <strong>functional</strong> storage:
            </p>
            <ul className="mt-3 ml-6 space-y-2 list-disc">
              <li>
                <strong>Strictly Necessary:</strong> The session cookie is
                essential for authentication. Without it, you cannot log in or
                use protected features of the Platform.
              </li>
              <li>
                <strong>Functional:</strong> Theme preference and data caches
                improve your experience but do not track you. No personal data
                is collected through these mechanisms.
              </li>
            </ul>
          </section>

          {/* Third parties */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              5. Third-Party Services
            </h2>
            <p>
              Our backend uses <strong>Appwrite Cloud</strong> (hosted in
              Frankfurt, Germany) for authentication and data storage. When you
              log in, Appwrite sets its own session cookie on its domain to
              maintain your server-side session. This cookie is not accessible
              to any other third party.
            </p>
            <p className="mt-2">
              We do not integrate any third-party analytics, advertising
              networks, or social media tracking pixels.
            </p>
          </section>

          {/* Managing cookies */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              6. Managing Your Cookies &amp; Storage
            </h2>
            <p>You can control cookies and local storage in several ways:</p>
            <ul className="mt-3 ml-6 space-y-2 list-disc">
              <li>
                <strong>Browser settings:</strong> Most browsers allow you to
                block or delete cookies and local storage via privacy settings.
              </li>
              <li>
                <strong>Logging out:</strong> Clicking &quot;Logout&quot; on
                the Platform deletes the session cookie immediately.
              </li>
              <li>
                <strong>Clearing site data:</strong> Use your browser&apos;s
                developer tools or settings to clear all data stored by
                easy-coop.de.
              </li>
            </ul>
            <p className="mt-3">
              <em>
                Note: Blocking or deleting the session cookie will log you out
                and prevent access to authenticated features.
              </em>
            </p>
          </section>

          {/* Data protection */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              7. Data Protection
            </h2>
            <p>
              The session cookie is marked <strong>HttpOnly</strong> and{" "}
              <strong>Secure</strong> (in production), meaning it is only
              transmitted over HTTPS and cannot be accessed by JavaScript. It
              uses the <strong>SameSite=Lax</strong> attribute to protect
              against cross-site request forgery.
            </p>
            <p className="mt-2">
              No personal data beyond your session credential and user ID is
              stored in cookies. Cached data in local storage does not contain
              passwords or sensitive financial information.
            </p>
          </section>

          {/* GDPR */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              8. Legal Basis (GDPR)
            </h2>
            <p>
              Under the EU General Data Protection Regulation (GDPR) and the
              German Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz
              (TDDDG), strictly necessary cookies do not require consent. Our
              session cookie falls under this exemption as it is essential for
              the service you have requested (authentication).
            </p>
            <p className="mt-2">
              Functional storage (theme preference, data caches) is used on the
              basis of our legitimate interest in providing a performant user
              experience. You may opt out at any time by clearing your
              browser&apos;s local storage.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this Cookie Policy from time to time. Any changes
              will be posted on this page with an updated revision date. We
              encourage you to review this page periodically.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              10. Contact Us
            </h2>
            <p>
              If you have any questions about our use of cookies, please contact
              us at{" "}
              <a
                href="mailto:service_internal@hystandards.de"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                service_internal@hystandards.de
              </a>
              .
            </p>
          </section>
        </div>

        <div className="pt-8 mt-12 border-t border-gray-200 dark:border-slate-700">
          <Link
            href="/"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );

  // return(
  //       <div className="pt-8 mt-12 border-t border-gray-200 dark:border-slate-700">
  //         <Link
  //           href="/"
  //           className="text-blue-600 hover:underline dark:text-blue-400"
  //         >
  //           &larr; Back to Home
  //         </Link>
  //       </div>
  // );
}
