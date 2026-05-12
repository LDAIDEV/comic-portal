import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Search,
  Tags,
  SortAsc,
  Plus,
  X,
  BookOpen,
  Image as ImageIcon,
  Pencil,
  Trash2,
  LayoutDashboard,
  Home,
  Lock,
  LogOut,
  Star,
  Library,
  Eye,
  Menu,
  Database,
  FileText,
  Layers,
  Megaphone,
  UserPlus,
  Sun,
  Moon,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@supabase/supabase-js";

const comicPagesBucket = "Comic-pages";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

function isAllowedAdmin(email) {
  if (!email) return false;
  if (adminEmails.length === 0) return true;
  return adminEmails.includes(email.toLowerCase());
}

const defaultGenres = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Superhero",
];

const starterComics = [
  {
    id: "comic-azure-knights",
    title: "Azure Knights",
    alternativeTitles: ["Skybound Knights", "Knights of Azure"],
    author: "Mika Vale",
    genres: ["Fantasy", "Adventure"],
    description: "A band of sky-guardians protects floating kingdoms from ancient machines.",
    cover: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=900&auto=format&fit=crop",
    featured: true,
    status: "Published",
    createdAt: "2026-05-01",
    chapters: [
      {
        id: "azure-chapter-1",
        title: "Chapter 1: The Floating Gate",
        createdAt: "2026-05-01",
        files: [{ id: "azure-file-1", name: "azure-knights-chapter-1.pdf", type: "PDF", src: "" }],
      },
      {
        id: "azure-chapter-2",
        title: "Chapter 2: The Clockwork Storm",
        createdAt: "2026-05-02",
        files: [{ id: "azure-file-2", name: "azure-knights-chapter-2.cbz", type: "Archive", src: "" }],
      },
    ],
  },
  {
    id: "comic-neon-alley",
    title: "Neon Alley",
    alternativeTitles: ["Neon Backstreet", "Memory Courier"],
    author: "Jon Reyes",
    genres: ["Sci-Fi", "Mystery"],
    description: "A courier follows a glowing trail through a city that rewrites memories.",
    cover: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?q=80&w=900&auto=format&fit=crop",
    featured: true,
    status: "Published",
    createdAt: "2026-05-03",
    chapters: [
      {
        id: "neon-chapter-1",
        title: "Chapter 1: Delivery 404",
        createdAt: "2026-05-03",
        files: [{ id: "neon-file-1", name: "neon-alley-chapter-1.pdf", type: "PDF", src: "" }],
      },
    ],
  },
  {
    id: "comic-paper-heart-club",
    title: "Paper Heart Club",
    alternativeTitles: ["Letter Hearts", "The Paper Hearts"],
    author: "Lina Song",
    genres: ["Romance", "Slice of Life"],
    description: "Four friends run a letter-writing booth and discover everyone has a secret.",
    cover: "https://images.unsplash.com/photo-1515462277126-2dd0c162007a?q=80&w=900&auto=format&fit=crop",
    featured: false,
    status: "Draft",
    createdAt: "2026-05-05",
    chapters: [
      {
        id: "paper-chapter-1",
        title: "Chapter 1: Dear Stranger",
        createdAt: "2026-05-05",
        files: [{ id: "paper-file-1", name: "paper-heart-club-page-1.png", type: "Image", src: "" }],
      },
    ],
  },
];

function normalizeTitle(title) {
  return title.trim().split(" ").filter(Boolean).join(" ");
}

function alphabetGroup(title) {
  const first = title.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function uniqueGenres(comics) {
  const genreSet = new Set(defaultGenres);
  comics.forEach((comic) => comic.genres.forEach((genre) => genreSet.add(genre)));
  return Array.from(genreSet).sort((a, b) => a.localeCompare(b));
}

function getFileType(file) {
  const name = file.name.toLowerCase();
  if (file.type.startsWith("image/")) return "Image";
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "PDF";
  if (name.endsWith(".cbz") || name.endsWith(".zip") || name.endsWith(".cbr")) return "Archive";
  return "File";
}

function slugify(value) {
  const text = normalizeTitle(value || "untitled").toLowerCase();
  let output = "";
  let previousWasDash = false;

  for (const character of text) {
    const isLetterOrNumber =
      (character >= "a" && character <= "z") ||
      (character >= "0" && character <= "9");

    if (isLetterOrNumber) {
      output += character;
      previousWasDash = false;
    } else if (!previousWasDash) {
      output += "-";
      previousWasDash = true;
    }
  }

  while (output.startsWith("-")) output = output.slice(1);
  while (output.endsWith("-")) output = output.slice(0, -1);

  return output || "untitled";
}

function splitLines(value) {
  return String(value || "")
    .split(String.fromCharCode(10))
    .map((line) => line.replaceAll(String.fromCharCode(13), ""));
}

async function uploadComicFileToSupabase(file, comicTitle, chapterTitle, index, folder = "chapters") {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "file";
  const comicSlug = slugify(comicTitle || "untitled-comic");
  const chapterSlug = slugify(chapterTitle || "chapter");
  const pageNumber = String(index + 1).padStart(3, "0");
  const filePath = `${folder}/${comicSlug}/${chapterSlug}/${pageNumber}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(comicPagesBucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(comicPagesBucket).getPublicUrl(filePath);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: getFileType(file),
    src: data.publicUrl,
    path: filePath,
  };
}

async function uploadCoverToSupabase(file, comicTitle) {
  const uploaded = await uploadComicFileToSupabase(file, comicTitle || "untitled-comic", "cover", 0, "covers");
  return uploaded;
}

function storagePathFromPublicUrl(url) {
  if (!url || typeof url !== "string") return "";
  const marker = `/storage/v1/object/public/${comicPagesBucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return "";
  const path = url.slice(index + marker.length).split("?")[0];
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

function getComicStoragePaths(comic) {
  const filePaths = (comic.chapters || [])
    .flatMap((chapter) => chapter.files || [])
    .map((file) => file.path || storagePathFromPublicUrl(file.src))
    .filter(Boolean);

  const coverPath = storagePathFromPublicUrl(comic.cover || comic.cover_url || "");
  return Array.from(new Set([...filePaths, coverPath].filter(Boolean)));
}

async function getStoragePathsForComic(comicId) {
  if (!supabase || !comicId) {
    return [];
  }

  const { data: comicData, error: comicError } = await supabase
    .from("comics")
    .select("cover_url")
    .eq("id", comicId)
    .single();

  if (comicError && comicError.code !== "PGRST116") {
    throw comicError;
  }

  const { data: fileData, error: fileError } = await supabase
    .from("chapter_files")
    .select(`
      file_path,
      chapters!inner (
        comic_id
      )
    `)
    .eq("chapters.comic_id", comicId);

  if (fileError) {
    throw fileError;
  }

  const coverPath = storagePathFromPublicUrl(comicData?.cover_url || "");
  const filePaths = (fileData || []).map((row) => row.file_path).filter(Boolean);
  return Array.from(new Set([...filePaths, coverPath].filter(Boolean)));
}

async function removeStorageFiles(paths) {
  const uniquePaths = Array.from(new Set((paths || []).filter(Boolean)));
  if (!supabase || uniquePaths.length === 0) return;

  const { error } = await supabase.storage.from(comicPagesBucket).remove(uniquePaths);
  if (error) {
    console.warn("Some storage files could not be removed:", error.message);
  }
}

function dbComicToAppComic(row) {
  return {
    id: row.id,
    title: row.title,
    alternativeTitles: row.alternative_titles || [],
    author: row.author || "Unknown creator",
    description: row.description || "No description added yet.",
    cover: row.cover_url || "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=900&auto=format&fit=crop",
    genres: row.genres || [],
    featured: Boolean(row.featured),
    status: row.status || "Draft",
    createdAt: row.created_at,
    chapters: (row.chapters || [])
      .slice()
      .sort((a, b) => (a.chapter_order || 0) - (b.chapter_order || 0))
      .map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        createdAt: chapter.created_at,
        files: (chapter.chapter_files || [])
          .slice()
          .sort((a, b) => (a.page_order || 0) - (b.page_order || 0))
          .map((file) => ({
            id: file.id,
            name: file.name,
            type: file.file_type,
            src: file.file_url,
            path: file.file_path || "",
          })),
      })),
  };
}

async function loadComicsFromSupabase() {
  if (!supabase) {
    return starterComics;
  }

  const { data, error } = await supabase
    .from("comics")
    .select(`
      id,
      title,
      alternative_titles,
      author,
      description,
      cover_url,
      genres,
      featured,
      status,
      created_at,
      chapters (
        id,
        title,
        chapter_order,
        created_at,
        chapter_files (
          id,
          name,
          file_type,
          file_url,
          file_path,
          page_order,
          created_at
        )
      )
    `)
    .order("title", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(dbComicToAppComic);
}

async function saveComicToSupabase(editingId, comicPayload) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const previousStoragePaths = editingId ? await getStoragePathsForComic(editingId) : [];

  const comicRow = {
    title: comicPayload.title,
    alternative_titles: comicPayload.alternativeTitles || [],
    author: comicPayload.author,
    description: comicPayload.description,
    cover_url: comicPayload.cover,
    genres: comicPayload.genres || [],
    featured: comicPayload.featured,
    status: comicPayload.status,
    updated_at: new Date().toISOString(),
  };

  let comicId = editingId;

  if (editingId) {
    const { error: updateError } = await supabase
      .from("comics")
      .update(comicRow)
      .eq("id", editingId);

    if (updateError) throw updateError;

    const { error: deleteChaptersError } = await supabase
      .from("chapters")
      .delete()
      .eq("comic_id", editingId);

    if (deleteChaptersError) throw deleteChaptersError;
  } else {
    const { data, error: insertError } = await supabase
      .from("comics")
      .insert(comicRow)
      .select("id")
      .single();

    if (insertError) throw insertError;
    comicId = data.id;
  }

  for (const [chapterIndex, chapter] of comicPayload.chapters.entries()) {
    const { data: insertedChapter, error: chapterError } = await supabase
      .from("chapters")
      .insert({
        comic_id: comicId,
        title: chapter.title,
        chapter_order: chapterIndex + 1,
      })
      .select("id")
      .single();

    if (chapterError) throw chapterError;

    const fileRows = (chapter.files || []).map((file, fileIndex) => ({
      chapter_id: insertedChapter.id,
      name: file.name,
      file_type: file.type,
      file_url: file.src,
      file_path: file.path || storagePathFromPublicUrl(file.src),
      page_order: fileIndex + 1,
    }));

    if (fileRows.length > 0) {
      const { error: filesError } = await supabase.from("chapter_files").insert(fileRows);
      if (filesError) throw filesError;
    }
  }

  const nextStoragePaths = getComicStoragePaths(comicPayload);
  const pathsToRemove = previousStoragePaths.filter((path) => !nextStoragePaths.includes(path));
  await removeStorageFiles(pathsToRemove);

  return comicId;
}

async function deleteComicFromSupabase(comicId) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const storagePaths = await getStoragePathsForComic(comicId);

  const { error } = await supabase.from("comics").delete().eq("id", comicId);
  if (error) throw error;

  await removeStorageFiles(storagePaths);
}

async function togglePublishInSupabase(comic) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const nextStatus = comic.status === "Published" ? "Draft" : "Published";

  const { error } = await supabase
    .from("comics")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", comic.id);

  if (error) throw error;
}

async function shareWebsite(title = "Jjangboards", text = "Read comics on Jjangboards.") {
  const shareUrl = window.location.origin;

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: shareUrl });
      return;
    } catch (error) {
      if (error.name !== "AbortError") console.error(error);
    }
  }

  try {
    await navigator.clipboard.writeText(shareUrl);
    alert("Link copied to clipboard.");
  } catch {
    alert(`Share this link: ${shareUrl}`);
  }
}

function pathIsAdmin() {
  return window.location.pathname.endsWith("/admin");
}

function navigateTo(path) {
  const basePath = import.meta.env.BASE_URL || "/";
  const targetPath = path === "/" ? basePath : path;
  window.history.pushState({}, "", targetPath);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/10 p-10 text-center text-slate-300">
      <BookOpen className="mx-auto mb-3 h-10 w-10 text-violet-200" />
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">{description}</p>
    </div>
  );
}

const adsenseClient = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT || "";
const adSlots = {
  top: import.meta.env.VITE_GOOGLE_ADSENSE_TOP_SLOT || "",
  catalog: import.meta.env.VITE_GOOGLE_ADSENSE_CATALOG_SLOT || "",
  bottom: import.meta.env.VITE_GOOGLE_ADSENSE_BOTTOM_SLOT || "",
};

function GoogleAdSlot({ label = "Advertisement", slot = "" }) {
  useEffect(() => {
    if (!adsenseClient || !slot) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // AdSense may not be ready immediately; the script will retry on later renders.
    }
  }, [slot]);

  return (
    <aside className="rounded-[2rem] border border-dashed border-amber-300/40 bg-amber-300/10 p-5 text-center text-amber-100">
      {adsenseClient && slot ? (
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={adsenseClient}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div>
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-amber-300 text-slate-950">
            <Megaphone className="h-6 w-6" />
          </div>
          <p className="font-bold">{label}</p>
        </div>
      )}
    </aside>
  );
}

function ComicCard({ comic, onRead, adminActions }) {
  const chapterCount = comic.chapters?.length || 0;
  const fileCount = comic.chapters?.reduce((total, chapter) => total + chapter.files.length, 0) || 0;

  return (
    <motion.article layout className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-lg">
      <div className="relative">
        <img src={comic.cover} alt={comic.title} className="h-56 w-full object-cover" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {comic.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-slate-950">
              <Star className="h-3.5 w-3.5" /> Featured
            </span>
          )}
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${comic.status === "Published" ? "bg-emerald-300 text-slate-950" : "bg-slate-800 text-slate-200"}`}>
            {comic.status}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-lg font-bold text-white">{comic.title}</h3>
          <p className="text-sm text-slate-400">by {comic.author}</p>
          {comic.alternativeTitles?.length > 0 && (
            <p className="mt-1 line-clamp-1 text-xs text-slate-500">Also known as: {comic.alternativeTitles.join(", ")}</p>
          )}
        </div>
        <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-300">{comic.description}</p>
        <div className="flex flex-wrap gap-2">
          {comic.genres.map((genre) => (
            <span key={genre} className="rounded-full bg-violet-300/15 px-3 py-1 text-xs text-violet-100">
              {genre}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 px-3 py-2">
            <Layers className="h-4 w-4" /> {chapterCount} chapter{chapterCount === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 px-3 py-2">
            <FileText className="h-4 w-4" /> {fileCount} file{fileCount === 1 ? "" : "s"}
          </span>
        </div>
        {adminActions ? (
          <div className="flex flex-wrap gap-2 pt-1">{adminActions}</div>
        ) : (
          <Button type="button" onClick={() => onRead(comic)} className="w-full rounded-2xl py-5">
            <Eye className="mr-2 h-4 w-4" /> View chapters
          </Button>
        )}
      </div>
    </motion.article>
  );
}

function CustomerLanding({ comics, allGenres, selectedGenre, setSelectedGenre, query, setQuery, sortOrder, setSortOrder, onRead }) {
  const publicComics = useMemo(() => comics.filter((comic) => comic.status === "Published"), [comics]);
  const featured = publicComics.filter((comic) => comic.featured).slice(0, 3);

  const filteredComics = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return publicComics
      .filter((comic) => {
        const chapterText = (comic.chapters || []).map((chapter) => `${chapter.title} ${chapter.files.map((file) => file.name).join(" ")}`).join(" ");
        const matchesSearch =
          !normalizedQuery ||
          comic.title.toLowerCase().includes(normalizedQuery) ||
          comic.author.toLowerCase().includes(normalizedQuery) ||
          comic.description.toLowerCase().includes(normalizedQuery) ||
          (comic.alternativeTitles || []).some((title) => title.toLowerCase().includes(normalizedQuery)) ||
          chapterText.toLowerCase().includes(normalizedQuery) ||
          comic.genres.some((genre) => genre.toLowerCase().includes(normalizedQuery));
        const matchesGenre = selectedGenre === "All" || comic.genres.includes(selectedGenre);
        return matchesSearch && matchesGenre;
      })
      .sort((a, b) => {
        const result = a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
        return sortOrder === "A-Z" ? result : -result;
      });
  }, [publicComics, query, selectedGenre, sortOrder]);

  const groupedComics = useMemo(() => {
    return filteredComics.reduce((groups, comic) => {
      const group = alphabetGroup(comic.title);
      groups[group] = groups[group] || [];
      groups[group].push(comic);
      return groups;
    }, {});
  }, [filteredComics]);

  return (
    <div className="space-y-8">
      <GoogleAdSlot label="Advertisement" slot={adSlots.top} />

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-400/15 px-3 py-1 text-sm text-violet-200">
            <Library className="h-4 w-4" /> Jjangboards
          </p>
          <h1 className="max-w-3xl text-5xl font-black tracking-tight sm:text-6xl">Discover your next favorite story.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Browse comics by title, genre, and chapter. Some chapters can be PDFs, while others can be uploaded as individual image pages.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button className="rounded-2xl px-6 py-6 text-base" onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}>
              Browse catalog
            </Button>
            <Button variant="secondary" className="rounded-2xl px-6 py-6 text-base" onClick={() => setSelectedGenre("Fantasy")}>
              View Fantasy
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-[2rem] border border-white/10 bg-slate-900 p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Featured comics</h2>
              <p className="text-sm text-slate-400">Promoted from the admin backend</p>
            </div>
            <Star className="h-6 w-6 text-amber-300" />
          </div>
          <div className="space-y-3">
            {featured.length ? (
              featured.map((comic) => (
                <button key={comic.id} onClick={() => onRead(comic)} className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-violet-300">
                  <img src={comic.cover} alt={comic.title} className="h-20 w-16 rounded-xl object-cover" />
                  <div>
                    <h3 className="font-bold text-white">{comic.title}</h3>
                    <p className="text-sm text-slate-400">{comic.chapters?.length || 0} chapter{comic.chapters?.length === 1 ? "" : "s"}</p>
                  </div>
                </button>
              ))
            ) : (
              <p className="rounded-2xl bg-white/5 p-4 text-sm text-slate-400">No featured comics yet.</p>
            )}
          </div>
        </motion.div>
      </section>

      <section id="catalog" className="space-y-5">
        <Card className="rounded-[2rem] border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur">
          <CardContent className="p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search comics, chapters, creators, or genres..." className="w-full rounded-2xl border border-white/10 bg-slate-900 py-3 pl-12 pr-4 outline-none transition focus:border-violet-300" />
              </div>

              <select value={selectedGenre} onChange={(event) => setSelectedGenre(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none transition focus:border-violet-300">
                <option value="All">All genres</option>
                {allGenres.map((genre) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>

              <button onClick={() => setSortOrder((current) => (current === "A-Z" ? "Z-A" : "A-Z"))} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 transition hover:border-violet-300">
                <SortAsc className="h-5 w-5" /> {sortOrder}
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between px-1 text-sm text-slate-400">
          <span>{filteredComics.length} published comic{filteredComics.length === 1 ? "" : "s"} shown</span>
          <span>Grouped alphabetically</span>
        </div>

        <AnimatePresence mode="popLayout">
          {Object.keys(groupedComics).length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              <EmptyState title="No public comics found" description="Try clearing your filters or publish more comics from the admin backend." />
            </motion.div>
          ) : (
            Object.entries(groupedComics).map(([letter, items], groupIndex) => (
              <React.Fragment key={letter}>
                {groupIndex === 1 && <GoogleAdSlot label="Advertisement" slot={adSlots.catalog} />}
                <motion.section layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-300 text-xl font-black text-slate-950">{letter}</div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{letter} titles</h2>
                      <p className="text-sm text-slate-400">{items.length} comic{items.length === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((comic) => (
                      <ComicCard key={comic.id} comic={comic} onRead={onRead} />
                    ))}
                  </div>
                </motion.section>
              </React.Fragment>
            ))
          )}
        </AnimatePresence>

        <GoogleAdSlot label="Advertisement" slot={adSlots.bottom} />
      </section>
    </div>
  );
}

function AdminAuth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      const userEmail = data.session?.user?.email || "";
      if (data.session?.user && isAllowedAdmin(userEmail)) {
        onLogin();
      } else if (data.session?.user && !isAllowedAdmin(userEmail)) {
        setMessage("You are signed in, but this email is not authorized as an admin.");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const userEmail = session?.user?.email || "";
      if (session?.user && isAllowedAdmin(userEmail)) {
        onLogin();
      } else if (session?.user && !isAllowedAdmin(userEmail)) {
        setMessage("You are signed in, but this email is not authorized as an admin.");
      }
    });

    return () => listener.subscription.unsubscribe();
    // onLogin is intentionally omitted to avoid re-triggering admin auth refresh loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage("Supabase is not configured yet. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setMessage("Enter both an email and password.");
      return;
    }

    if (!isAllowedAdmin(cleanEmail)) {
      setMessage("This email is not listed in VITE_ADMIN_EMAILS, so it cannot access the admin backend.");
      return;
    }

    setLoading(true);

    if (mode === "create") {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
      });

      setLoading(false);

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.session) {
        onLogin();
      } else {
        setMessage("Account created. Check your email to confirm the account, then log in.");
        setMode("login");
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    onLogin();
  };

  if (!supabase) {
    return (
      <section className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-violet-300 text-slate-950">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-black text-white">Connect Supabase Auth</h1>
        <p className="mt-3 text-slate-300">Add your Supabase URL and anon key to your environment variables, then restart the app.</p>
        <div className="mt-6 rounded-2xl bg-slate-900 p-4 text-left text-sm leading-6 text-slate-400">
          <p className="font-semibold text-slate-200">Required variables</p>
          <p className="mt-1">VITE_SUPABASE_URL</p>
          <p>VITE_SUPABASE_ANON_KEY</p>
          <p>VITE_ADMIN_EMAILS</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-violet-300 text-slate-950">
        {mode === "create" ? <UserPlus className="h-8 w-8" /> : <Lock className="h-8 w-8" />}
      </div>
      <h1 className="text-4xl font-black text-white">{mode === "create" ? "Create Admin Account" : "Admin Login"}</h1>
      <p className="mt-3 text-slate-300">
        {mode === "create"
          ? "Create an admin account using Supabase email/password authentication."
          : "Log in with the admin email and password stored in Supabase Auth."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">Admin email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-300" />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-300" />
        </label>

        {message && <p className="rounded-2xl bg-slate-900 p-3 text-sm text-slate-300">{message}</p>}

        <Button type="submit" disabled={loading} className="w-full rounded-2xl py-6 text-base">
          {loading ? "Please wait..." : mode === "create" ? "Create account" : "Log in"}
        </Button>
      </form>

      <button type="button" onClick={() => { setMode(mode === "create" ? "login" : "create"); setMessage(""); }} className="mt-4 text-sm text-slate-400 underline underline-offset-4 hover:text-violet-200">
        {mode === "create" ? "Already have an account? Log in" : "Need to create the admin account?"}
      </button>
    </section>
  );
}

function AdminBackend({ comics, allGenres, refreshComics }) {
  const blankForm = {
    title: "",
    author: "",
    description: "",
    genres: [],
    newGenre: "",
    alternativeTitlesText: "",
    cover: "",
    featured: false,
    status: "Published",
    chapters: [],
    newChapterTitle: "",
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [adminQuery, setAdminQuery] = useState("");
  const [form, setForm] = useState(blankForm);

  const stats = useMemo(() => {
    const published = comics.filter((comic) => comic.status === "Published").length;
    const drafts = comics.filter((comic) => comic.status === "Draft").length;
    const featured = comics.filter((comic) => comic.featured).length;
    const chapters = comics.reduce((total, comic) => total + (comic.chapters?.length || 0), 0);
    return { total: comics.length, published, drafts, featured, chapters };
  }, [comics]);

  const adminComics = useMemo(() => {
    const q = adminQuery.trim().toLowerCase();
    return comics
      .filter((comic) => {
        if (!q) return true;
        const chapterText = (comic.chapters || []).map((chapter) => `${chapter.title} ${chapter.files.map((file) => file.name).join(" ")}`).join(" ");
        return (
          comic.title.toLowerCase().includes(q) ||
          comic.author.toLowerCase().includes(q) ||
          (comic.alternativeTitles || []).some((title) => title.toLowerCase().includes(q)) ||
          comic.status.toLowerCase().includes(q) ||
          chapterText.toLowerCase().includes(q) ||
          comic.genres.some((genre) => genre.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  }, [comics, adminQuery]);

  const resetForm = () => {
    setEditingId(null);
    setForm(blankForm);
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!supabase) {
      alert("Supabase is not configured. Add your Supabase environment variables first.");
      event.target.value = "";
      return;
    }

    try {
      const uploadedCover = await uploadCoverToSupabase(file, form.title || "untitled-comic");
      setForm((current) => ({ ...current, cover: uploadedCover.src }));
    } catch (error) {
      console.error(error);
      alert(error.message || "Cover upload failed. Please try again.");
    } finally {
      event.target.value = "";
    }
  };

  const handleChapterUpload = async (event) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  if (!supabase) {
    alert("Supabase is not configured. Add your Supabase environment variables first.");
    event.target.value = "";
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    alert("Please log in again before uploading chapter files.");
    event.target.value = "";
    return;
  }

  const chapterNumber = form.chapters.length + 1;
  const chapterTitle = normalizeTitle(form.newChapterTitle) || `Chapter ${chapterNumber}`;

  try {
    const convertedFiles = await Promise.all(
      files.map((file, index) =>
        uploadComicFileToSupabase(file, form.title || "untitled-comic", chapterTitle, index)
      )
    );

    setForm((current) => ({
      ...current,
      chapters: [
        ...current.chapters,
        {
          id: crypto.randomUUID(),
          title: chapterTitle,
          createdAt: todayDate(),
          files: convertedFiles,
        },
      ],
      newChapterTitle: "",
    }));
  } catch (error) {
    console.error(error);
    alert(error.message || "Upload failed. Please try again.");
  } finally {
    event.target.value = "";
  }
};

  const removeChapter = (chapterId) => {
    setForm((current) => ({ ...current, chapters: current.chapters.filter((chapter) => chapter.id !== chapterId) }));
  };

  const removeChapterFile = (chapterId, fileId) => {
    setForm((current) => ({
      ...current,
      chapters: current.chapters.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, files: chapter.files.filter((file) => file.id !== fileId) } : chapter
      ),
    }));
  };

  const toggleGenre = (genre) => {
    setForm((current) => {
      const exists = current.genres.includes(genre);
      return {
        ...current,
        genres: exists ? current.genres.filter((item) => item !== genre) : [...current.genres, genre],
      };
    });
  };

  const addCustomGenre = () => {
    const genre = form.newGenre.trim();
    if (!genre) return;
    setForm((current) => ({
      ...current,
      genres: current.genres.includes(genre) ? current.genres : [...current.genres, genre],
      newGenre: "",
    }));
  };

  const saveComic = async (event) => {
  event.preventDefault();

  const title = normalizeTitle(form.title);
  if (!title || form.genres.length === 0 || form.chapters.length === 0) return;

  const comicPayload = {
    title,
    author: form.author.trim() || "Unknown creator",
    description: form.description.trim() || "No description added yet.",
    genres: [...form.genres].sort((a, b) => a.localeCompare(b)),
    alternativeTitles: splitLines(form.alternativeTitlesText)
      .map((item) => normalizeTitle(item))
      .filter(Boolean),
    cover: form.cover || "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=900&auto=format&fit=crop",
    featured: form.featured,
    status: form.status,
    chapters: form.chapters,
    createdAt: todayDate(),
  };

  try {
    await saveComicToSupabase(editingId, comicPayload);
    await refreshComics?.();
    resetForm();
  } catch (error) {
    console.error(error);
    alert(error.message || "Save failed. Please try again.");
  }
};

  const startEdit = (comic) => {
    setEditingId(comic.id);
    setForm({
      title: comic.title,
      author: comic.author,
      description: comic.description,
      genres: comic.genres,
      newGenre: "",
      alternativeTitlesText: (comic.alternativeTitles || []).join(String.fromCharCode(10)),
      cover: comic.cover,
      featured: comic.featured,
      status: comic.status,
      chapters: comic.chapters || [],
      newChapterTitle: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteComic = async (comicId) => {
  try {
    await deleteComicFromSupabase(comicId);
    await refreshComics?.();

    if (editingId === comicId) {
      resetForm();
    }
  } catch (error) {
    console.error(error);
    alert(error.message || "Delete failed. Please try again.");
  }
};

  const togglePublish = async (comicId) => {
  const comic = comics.find((item) => item.id === comicId);
  if (!comic) return;

  try {
    await togglePublishInSupabase(comic);
    await refreshComics?.();
  } catch (error) {
    console.error(error);
    alert(error.message || "Status update failed. Please try again.");
  }
};

  if (!isLoggedIn) {
    return (
  <AdminAuth
    onLogin={() => {
      setIsLoggedIn(true);
      refreshComics?.();
    }}
  />
);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-400/15 px-3 py-1 text-sm text-violet-200">
              <LayoutDashboard className="h-4 w-4" /> Backend Dashboard
            </p>
            <h1 className="text-4xl font-black tracking-tight text-white">Manage comics by chapter.</h1>
            <p className="mt-4 max-w-xl text-slate-300">Upload a cover, tag genres, then add chapters with PDF/CBZ files or image-page uploads.</p>
          </div>
          <button onClick={async () => { await supabase?.auth.signOut(); setIsLoggedIn(false); }} className="rounded-2xl border border-white/10 bg-slate-900 p-3 text-slate-300 transition hover:border-violet-300">
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Total", stats.total, Database],
            ["Published", stats.published, Eye],
            ["Drafts", stats.drafts, Pencil],
            ["Featured", stats.featured, Star],
            ["Chapters", stats.chapters, Layers],
          ].map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-slate-900 p-4">
              <Icon className="mb-2 h-5 w-5 text-violet-200" />
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        <form onSubmit={saveComic} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-300">Comic title *</span>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Moonlight Market" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-300" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-300">Creator / author</span>
              <input value={form.author} onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))} placeholder="Creator name" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-300" />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">Description</span>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Write a short synopsis for readers." rows={4} className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-300" />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">Alternative titles</span>
            <textarea
              value={form.alternativeTitlesText}
              onChange={(event) => setForm((current) => ({ ...current, alternativeTitlesText: event.target.value }))}
              placeholder={['Add one alternative title per line, e.g.', 'Moon Market', 'Lunar Bazaar'].join(String.fromCharCode(10))}
              rows={3}
              className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-300"
            />
          </label>

          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-900/80 p-5 text-center transition hover:border-violet-300">
            <ImageIcon className="mb-2 h-7 w-7 text-violet-200" />
            <span className="font-semibold text-white">Upload cover image</span>
            <span className="mt-1 text-xs text-slate-400">PNG, JPG, WEBP</span>
            <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
          </label>

          {(form.cover || form.title) && (
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-300">Comic preview</p>
              <div className="flex items-center gap-4">
                <img src={form.cover || "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=900&auto=format&fit=crop"} alt="Cover preview" className="h-20 w-16 rounded-xl object-cover" />
                <div>
                  <p className="font-medium text-white">{form.title || "Untitled comic"}</p>
                  <p className="text-sm text-slate-400">{form.chapters.length} chapter{form.chapters.length === 1 ? "" : "s"} added</p>
                  {form.alternativeTitlesText.trim() && (
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">Also known as: {splitLines(form.alternativeTitlesText).map((title) => normalizeTitle(title)).filter(Boolean).join(", ")}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-300">Visibility</span>
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-300">
                <option>Published</option>
                <option>Draft</option>
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-300">
              <input type="checkbox" checked={form.featured} onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))} className="h-5 w-5 accent-violet-300" />
              Feature on landing page
            </label>
          </div>

          <div className="space-y-3 rounded-[2rem] border border-white/10 bg-slate-900/60 p-4">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Layers className="h-4 w-4" /> Chapter uploads *
              </p>
              <p className="mt-1 text-xs text-slate-500">Add one chapter at a time. Select one PDF/CBZ file or select multiple image pages at once. Image pages will appear vertically in reading order.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input value={form.newChapterTitle} onChange={(event) => setForm((current) => ({ ...current, newChapterTitle: event.target.value }))} placeholder={`Chapter title, e.g. Chapter ${form.chapters.length + 1}`} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-300" />
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-violet-300 px-5 py-3 font-semibold text-slate-950 transition hover:bg-violet-200">
                <Upload className="h-4 w-4" /> Upload chapter files
                <input type="file" multiple accept="image/*,.pdf,.cbz,.cbr,.zip" onChange={handleChapterUpload} className="hidden" />
              </label>
            </div>

            {form.chapters.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No chapters added yet. Add at least one chapter before saving.</p>
            ) : (
              <div className="space-y-3">
                {form.chapters.map((chapter, index) => (
                  <div key={chapter.id} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{index + 1}. {chapter.title}</p>
                        <p className="text-xs text-slate-500">{chapter.files.length} uploaded file{chapter.files.length === 1 ? "" : "s"}</p>
                      </div>
                      <button type="button" onClick={() => removeChapter(chapter.id)} className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:border-red-300 hover:text-red-200">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {chapter.files.map((file) => (
                        <span key={file.id} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300">
                          {file.type === "Image" ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                          {file.name}
                          <button type="button" onClick={() => removeChapterFile(chapter.id, file.id)} className="text-slate-500 hover:text-red-200">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    {chapter.files.some((file) => file.type === "Image" && file.src) && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {chapter.files.filter((file) => file.type === "Image" && file.src).slice(0, 6).map((file) => (
                          <img key={file.id} src={file.src} alt={file.name} className="h-24 rounded-xl object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-300">
                <Tags className="h-4 w-4" /> Genres *
              </span>
              <span className="text-xs text-slate-500">Select one or more</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {allGenres.map((genre) => {
                const active = form.genres.includes(genre);
                return (
                  <button type="button" key={genre} onClick={() => toggleGenre(genre)} className={`rounded-full border px-3 py-2 text-sm transition ${active ? "border-violet-300 bg-violet-300 text-slate-950" : "border-white/10 bg-slate-900 text-slate-300 hover:border-violet-300"}`}>
                    {genre}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input value={form.newGenre} onChange={(event) => setForm((current) => ({ ...current, newGenre: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomGenre(); } }} placeholder="Add custom genre" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-violet-300" />
              <Button type="button" onClick={addCustomGenre} className="rounded-2xl px-4">
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" className="rounded-2xl px-5 py-6 text-base">
              {editingId ? "Save changes" : "Upload comic"}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm} className="rounded-2xl px-5 py-6 text-base">
                <X className="mr-2 h-4 w-4" /> Cancel edit
              </Button>
            )}
          </div>
        </form>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }} className="space-y-5">
        <Card className="rounded-[2rem] border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur">
          <CardContent className="p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input value={adminQuery} onChange={(event) => setAdminQuery(event.target.value)} placeholder="Search backend records, chapters, or files..." className="w-full rounded-2xl border border-white/10 bg-slate-900 py-3 pl-12 pr-4 text-white outline-none transition focus:border-violet-300" />
            </div>
          </CardContent>
        </Card>

        <AnimatePresence mode="popLayout">
          {adminComics.length === 0 ? (
            <motion.div key="empty-admin" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              <EmptyState title="No backend records found" description="Upload a comic or clear the admin search field." />
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              {adminComics.map((comic) => (
                <ComicCard
                  key={comic.id}
                  comic={comic}
                  adminActions={
                    <>
                      <Button type="button" variant="secondary" onClick={() => startEdit(comic)} className="flex-1 rounded-2xl">
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => togglePublish(comic.id)} className="rounded-2xl">
                        {comic.status === "Published" ? "Unpublish" : "Publish"}
                      </Button>
                      <Button type="button" variant="destructive" onClick={() => deleteComic(comic.id)} className="rounded-2xl">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function ComicReaderModal({ comic, onClose }) {
  const [activeChapterId, setActiveChapterId] = useState(() => comic?.chapters?.[0]?.id || null);

  if (!comic) return null;

  const chapters = comic.chapters || [];
  const activeChapter = chapters.find((chapter) => chapter.id === activeChapterId) || chapters[0];
  const imageFiles = (activeChapter?.files.filter((file) => file.type === "Image" && file.src) || []).slice().sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
  );
  const documentFiles = activeChapter?.files.filter((file) => file.type !== "Image" || !file.src) || [];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-900/95 p-4 backdrop-blur">
          <div>
            <h2 className="text-xl font-black text-white">{comic.title}</h2>
            <p className="text-sm text-slate-400">{chapters.length} chapter{chapters.length === 1 ? "" : "s"}</p>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-white/10 p-3 text-slate-300 transition hover:border-violet-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[0.35fr_0.65fr]">
          <aside className="space-y-4">
            <img src={comic.cover} alt={comic.title} className="w-full rounded-3xl object-cover" />
            <div>
              <p className="text-sm text-slate-400">Creator</p>
              <p className="text-lg font-bold text-white">{comic.author}</p>
              {comic.alternativeTitles?.length > 0 && (
                <p className="mt-1 text-sm text-slate-400">Also known as: {comic.alternativeTitles.join(", ")}</p>
              )}
            </div>
            <p className="leading-7 text-slate-300">{comic.description}</p>
            <div className="flex flex-wrap gap-2">
              {comic.genres.map((genre) => (
                <span key={genre} className="rounded-full bg-violet-300/15 px-3 py-1 text-xs text-violet-100">{genre}</span>
              ))}
            </div>
          </aside>

          <section className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="mb-3 inline-flex items-center gap-2 font-semibold text-white">
                <Layers className="h-4 w-4" /> Chapters
              </p>
              {chapters.length === 0 ? (
                <p className="text-sm text-slate-400">No chapters uploaded yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {chapters.map((chapter, index) => (
                    <button key={chapter.id} onClick={() => setActiveChapterId(chapter.id)} className={`rounded-2xl border px-4 py-3 text-sm transition ${activeChapter?.id === chapter.id ? "border-violet-300 bg-violet-300 text-slate-950" : "border-white/10 bg-slate-950 text-slate-300 hover:border-violet-300"}`}>
                      {index + 1}. {chapter.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {activeChapter && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-xl font-black text-white">{activeChapter.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{activeChapter.files.length} file{activeChapter.files.length === 1 ? "" : "s"} in this chapter</p>

                {documentFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-slate-300">Chapter files</p>
                    {documentFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 p-3">
                        <span className="inline-flex min-w-0 items-center gap-2 text-sm text-slate-300">
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </span>
                        <span className="rounded-full bg-violet-300/15 px-3 py-1 text-xs text-violet-100">{file.type}</span>
                      </div>
                    ))}
                    <p className="text-xs text-slate-500">PDF/CBZ/ZIP files are available for this chapter.</p>
                  </div>
                )}

                {imageFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-3 text-sm font-semibold text-slate-300">Image pages</p>
                    <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-slate-950 leading-none">
                      {imageFiles.map((file, index) => (
                        <img key={file.id} src={file.src} alt={`Page ${index + 1}: ${file.name}`} className="block w-full h-auto object-contain m-0 p-0" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </motion.div>
    </div>
  );
}

export default function ComicPortalWebsite() {
  const [activeView, setActiveView] = useState(() => (pathIsAdmin() ? "admin" : "customer"));
  const [theme, setTheme] = useState(() => localStorage.getItem("comic_portal_theme") || "dark");
  const [comics, setComics] = useState([]);
  const [isLoadingComics, setIsLoadingComics] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("A-Z");
  const [readerComic, setReaderComic] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  const refreshComics = async ({ showLoading = false } = {}) => {
    if (showLoading) {
      setIsLoadingComics(true);
    }

    try {
      const loadedComics = await loadComicsFromSupabase();
      setComics(loadedComics);
    } catch (error) {
      console.error(error);
      setComics([]);
    } finally {
      if (showLoading) {
        setIsLoadingComics(false);
      }
    }
  };

  useEffect(() => {
    // Initial data load for Supabase-backed comic metadata.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshComics({ showLoading: true });
    // refreshComics is intentionally omitted so this runs only once on mount.
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refreshComics();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!adsenseClient) return;
    if (document.querySelector("script[data-adsense-script='true']")) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`;
    script.crossOrigin = "anonymous";
    script.dataset.adsenseScript = "true";
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    localStorage.setItem("comic_portal_theme", theme);
    document.documentElement.classList.toggle("light-theme", theme === "light");
  }, [theme]);

  useEffect(() => {
    const handleRouteChange = () => setActiveView(pathIsAdmin() ? "admin" : "customer");
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  const allGenres = useMemo(() => uniqueGenres(comics), [comics]);

  return (
    <main className={`min-h-screen transition-colors ${theme === "dark" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-950"}`}>
      <style>{`
        .light-theme .bg-slate-950 { background-color: rgb(241 245 249) !important; }
        .light-theme .bg-slate-900 { background-color: rgb(255 255 255) !important; }
        .light-theme .bg-slate-800 { background-color: rgb(226 232 240) !important; }
        .light-theme .bg-white\\/10, .light-theme .bg-white\\/5 { background-color: rgb(255 255 255) !important; }
        .light-theme .text-white { color: rgb(15 23 42) !important; }
        .light-theme .text-slate-300, .light-theme .text-slate-400, .light-theme .text-slate-500 { color: rgb(71 85 105) !important; }
        .light-theme .border-white\\/10, .light-theme .border-white\\/20 { border-color: rgb(203 213 225) !important; }
        .light-theme input, .light-theme textarea, .light-theme select { background-color: rgb(255 255 255) !important; color: rgb(15 23 42) !important; }
        .light-theme .shadow-2xl, .light-theme .shadow-xl, .light-theme .shadow-lg { box-shadow: 0 20px 45px rgb(15 23 42 / 0.12) !important; }
      `}</style>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button onClick={() => navigateTo("/")} className="flex items-center gap-3 text-left">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-300 text-slate-950">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-black leading-none">Jjangboards</p>
              <p className="text-xs text-slate-400">Comics and webtoons</p>
            </div>
          </button>

          <nav className="hidden gap-3 md:flex">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-violet-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-violet-200" onClick={() => navigateTo("/")}> 
              <Home className="h-4 w-4" /> Customer Site
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-violet-300" onClick={() => shareWebsite()}>
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-violet-300" onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
          </nav>

          <button className="rounded-2xl border border-white/10 p-3 text-slate-300 md:hidden" onClick={() => setMobileMenuOpen((current) => !current)}>
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mx-auto flex max-w-7xl gap-3 px-4 pb-4 sm:px-6 lg:px-8 md:hidden">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-violet-300 px-4 py-3 text-sm font-semibold text-slate-950" onClick={() => { navigateTo("/"); setMobileMenuOpen(false); }}>
              <Home className="h-4 w-4" /> Customer
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300" onClick={() => shareWebsite()}>
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300" onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        )}
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  {isLoadingComics ? (
    <EmptyState title="Loading comics..." description="Please wait while the library loads." />
  ) : activeView === "customer" ? (
    <CustomerLanding
      comics={comics}
      allGenres={allGenres}
      selectedGenre={selectedGenre}
      setSelectedGenre={setSelectedGenre}
      query={query}
      setQuery={setQuery}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      onRead={setReaderComic}
    />
  ) : (
    <AdminBackend
      comics={comics}
      allGenres={allGenres}
      refreshComics={refreshComics}
    />
  )}
</section>

      <ComicReaderModal comic={readerComic} onClose={() => setReaderComic(null)} />
    </main>
  );
}
