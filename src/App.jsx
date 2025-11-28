import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Bookmark,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Facebook,
  Heart,
  Image as ImageIcon,
  Instagram,
  Loader2,
  MessageCircle,
  MessageSquare,
  Play,
  Plus,
  Send,
  Settings,
  Share2,
  Smartphone,
  ThumbsUp,
  Trash2,
  Video,
  X,
} from "lucide-react";

const SocialMediaPreview = () => {
  const [platform, setPlatform] = useState("instagram");
  const [showEditor, setShowEditor] = useState(true);
  const [copySuccess, setCopySuccess] = useState("");
  const [isShortening, setIsShortening] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [postBatch, setPostBatch] = useState([]);

  const [postData, setPostData] = useState({
    whatsappNumber: "",
    caption: "✨ Legenda do post...",
    trelloLink: "",
    slides: [{ id: "init-1", type: "image", url: "" }],
  });

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataEncoded = params.get("data");
    if (!dataEncoded) return;

    try {
      const decoded = JSON.parse(decodeURIComponent(dataEncoded));

      if (decoded.slides) {
        decoded.slides = decoded.slides.map((s, i) => ({
          ...s,
          id: s.id || `restored-${i}-${Date.now()}`,
        }));
      } else {
        decoded.slides = [];
        if (decoded.mediaUrls) {
          decoded.mediaUrls.forEach((url, i) =>
            decoded.slides.push({ id: `legacy-${i}`, type: "image", url })
          );
        }
        if (decoded.videoUrl) {
          decoded.slides.push({
            id: "legacy-vid",
            type: "video",
            url: decoded.videoUrl,
            thumb: decoded.videoThumbnail,
          });
        }
      }

      if (decoded.slides.length === 0) {
        decoded.slides = [{ id: "empty-1", type: "image", url: "" }];
      }

      setPostData(decoded);
      if (decoded.initialPlatform) setPlatform(decoded.initialPlatform);
      setShowEditor(false);
    } catch (e) {
      console.error("Erro URL", e);
    }
  }, []);

  const getDriveId = (url) => {
    if (!url) return null;
    const regex = /[-\w]{25,}/;
    const match = url.match(regex);
    return match ? match[0] : null;
  };

  const processMediaLink = (url, type) => {
    if (!url) return { url: "", thumb: "" };

    const driveId = getDriveId(url);
    if (driveId && (url.includes("drive.google.com") || url.includes("docs.google.com"))) {
      return {
        url,
        thumb: `https://lh3.googleusercontent.com/d/${driveId}`,
      };
    }

    const youtubeRegex =
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\\s]{11})/;
    const ytMatch = url.match(youtubeRegex);
    if (ytMatch && ytMatch[1]) {
      return {
        url,
        thumb: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
      };
    }

    if (url.includes("vimeo.com")) {
      return { url, thumb: "https://placehold.co/600x600/1ab7ea/ffffff?text=Vimeo+Video" };
    }

    return { url, thumb: url };
  };

  const shortenUrl = async (longUrl) => {
    try {
      const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`;
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
      const response = await fetch(proxyUrl);
      if (response.ok) return await response.text();
      throw new Error("Falha API");
    } catch (error) {
      return longUrl;
    }
  };

  const generateSingleLinkUrl = () => {
    const stateToShare = { ...postData, initialPlatform: platform };
    return `${window.location.href.split("?")[0]}?data=${encodeURIComponent(JSON.stringify(stateToShare))}`;
  };

  const addSlide = (type) => {
    setPostData((prev) => ({
      ...prev,
      slides: [...prev.slides, { id: `slide-${Date.now()}`, type, url: "", thumb: "" }],
    }));
    setCurrentSlide(postData.slides.length);
  };

  const removeSlide = (index) => {
    const newSlides = postData.slides.filter((_, i) => i !== index);
    setPostData((prev) => ({
      ...prev,
      slides: newSlides.length ? newSlides : [{ id: `slide-${Date.now()}`, type: "image", url: "" }],
    }));
    if (currentSlide >= index && currentSlide > 0) setCurrentSlide((curr) => curr - 1);
  };

  const updateSlideUrl = (index, value) => {
    const newSlides = [...postData.slides];
    const item = newSlides[index];
    const processed = processMediaLink(value, item.type);

    item.url = value;
    item.thumb = processed.thumb;
    setPostData((prev) => ({ ...prev, slides: newSlides }));
  };

  const moveSlide = (index, direction) => {
    if (index + direction < 0 || index + direction >= postData.slides.length) return;
    const newSlides = [...postData.slides];
    [newSlides[index], newSlides[index + direction]] = [newSlides[index + direction], newSlides[index]];
    setPostData((prev) => ({ ...prev, slides: newSlides }));

    if (currentSlide === index) setCurrentSlide(index + direction);
    else if (currentSlide === index + direction) setCurrentSlide(index);
  };

  const handleAddToBatch = async () => {
    if (!postData.slides[0].url) return alert("Adicione pelo menos uma mídia!");
    setIsShortening(true);
    const shortLink = await shortenUrl(generateSingleLinkUrl());
    const summary =
      postData.caption.length > 25 ? `${postData.caption.substring(0, 25)}...` : postData.caption || "Sem legenda";

    setPostBatch([...postBatch, { link: shortLink, summary, trello: postData.trelloLink }]);
    setCopySuccess("Salvo!");
    setTimeout(() => setCopySuccess(""), 1500);
    setIsShortening(false);

    setPostData((prev) => ({
      ...prev,
      caption: "",
      trelloLink: "",
      slides: [{ id: `new-${Date.now()}`, type: "image", url: "" }],
    }));
    setCurrentSlide(0);
  };

  const handleFinalizeBatch = () => {
    if (postBatch.length === 0) return alert("Sua lista de posts está vazia!");
    if (!postData.whatsappNumber) return alert("Por favor, preencha o número do WhatsApp no campo 'WhatsApp Aprovação'.");

    const isPlural = postBatch.length > 1;
    let msg = "";

    if (isPlural) {
      msg = `Olá! Seguem os ${postBatch.length} posts para aprovação:\n\n`;
      postBatch.forEach((item, i) => {
        msg += `*Post ${i + 1}*\n🔗 ${item.link}\n\n`;
      });
    } else {
      msg = "Olá! Segue o post para aprovação:\n\n";
      msg += `🔗 ${postBatch[0].link}\n\n`;
    }

    const cleanNumber = postData.whatsappNumber.replace(/\D/g, "");
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const handleApprove = () => {
    if (!postData.whatsappNumber) return alert("Configure o WhatsApp no editor.");
    const cleanNumber = postData.whatsappNumber.replace(/\D/g, "");

    const text = `✅ *APROVADO!* \n\n${postData.trelloLink ? `📋 Link Tarefa: ${postData.trelloLink}\n` : ""}🔗 Link: ${window.location.href}`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const sendFeedbackToWhatsapp = () => {
    if (!postData.whatsappNumber) return alert("Configure o WhatsApp no editor.");
    const cleanNumber = postData.whatsappNumber.replace(/\D/g, "");

    const text = `⚠️ *AJUSTE SOLICITADO*\n\n📝: ${feedbackText}\n\n${postData.trelloLink ? `📋 Link Tarefa: ${postData.trelloLink}\n` : ""}🔗 Ref: ${window.location.href}`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col md:flex-row items-center md:items-start justify-center p-4 md:p-10 gap-6 md:gap-12">
      <div className={`w-full max-w-md flex flex-col gap-4 ${!showEditor ? "hidden md:flex" : "flex"}`}>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
          <div className="bg-slate-50/50 p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
              <ImageIcon size={16} className="text-blue-500" /> Conteúdo do Post
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                {postBatch.length} salvos
              </span>
              <button
                onClick={() => setShowEditor(false)}
                className="md:hidden p-1 text-slate-400 hover:text-slate-600"
                aria-label="Fechar editor"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-[11px] text-amber-800 flex gap-2 items-start leading-snug">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600" />
              <p>Use links públicos (Drive, Web, YouTube). O app ajusta automaticamente para a imagem não cortar.</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <Smartphone size={14} className="text-green-600 shrink-0" />
                <input
                  type="text"
                  className="w-full py-3 text-xs outline-none bg-transparent"
                  placeholder="WhatsApp Aprovação (Ex: 5511999999999)"
                  value={postData.whatsappNumber}
                  onChange={(e) => setPostData({ ...postData, whatsappNumber: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <ExternalLink size={14} className="text-blue-600 shrink-0" />
                <input
                  type="text"
                  className="w-full py-3 text-xs outline-none bg-transparent"
                  placeholder="Link da Tarefa (Trello, Notion, ClickUp...)"
                  value={postData.trelloLink}
                  onChange={(e) => setPostData({ ...postData, trelloLink: e.target.value })}
                />
              </label>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Galeria</span>
                <span className="text-[10px] font-medium text-slate-400">{postData.slides.length} arquivos</span>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                {postData.slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className="flex flex-col gap-1 bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-blue-400 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center text-white text-[10px] ${
                            slide.type === "video" ? "bg-red-500" : "bg-blue-500"
                          }`}
                        >
                          {slide.type === "video" ? <Video size={10} /> : <ImageIcon size={10} />}
                        </div>
                        <span className="text-[11px] font-bold text-gray-600">Slide {index + 1}</span>
                      </div>
                      <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => moveSlide(index, -1)}
                          disabled={index === 0}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 disabled:opacity-30"
                          aria-label="Mover para cima"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={() => moveSlide(index, 1)}
                          disabled={index === postData.slides.length - 1}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 disabled:opacity-30"
                          aria-label="Mover para baixo"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          onClick={() => removeSlide(index)}
                          className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-500"
                          aria-label="Remover slide"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      className="w-full text-xs border-b border-dashed border-gray-200 bg-transparent p-1 outline-none focus:border-blue-400 transition-colors text-slate-600 placeholder:text-slate-300"
                      placeholder={slide.type === "video" ? "Cole o link do Vídeo/YouTube..." : "Cole o link da Imagem..."}
                      value={slide.url}
                      onChange={(e) => updateSlideUrl(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => addSlide("image")}
                  className="flex-1 py-2.5 border border-dashed border-blue-300 text-blue-600 bg-blue-50/30 rounded-lg text-[10px] font-bold hover:bg-blue-50 flex justify-center items-center gap-1.5 transition-colors"
                >
                  <Plus size={12} /> ADICIONAR FOTO
                </button>
                <button
                  onClick={() => addSlide("video")}
                  className="flex-1 py-2.5 border border-dashed border-red-300 text-red-600 bg-red-50/30 rounded-lg text-[10px] font-bold hover:bg-red-50 flex justify-center items-center gap-1.5 transition-colors"
                >
                  <Plus size={12} /> ADICIONAR VÍDEO
                </button>
              </div>
            </div>

            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-xs h-28 resize-none outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
              value={postData.caption}
              onChange={(e) => setPostData({ ...postData, caption: e.target.value })}
              placeholder="Escreva a legenda aqui..."
            />

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleAddToBatch}
                disabled={isShortening}
                className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {isShortening ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} SALVAR NA LISTA
              </button>

              {postBatch.length > 0 && (
                <div className="flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1">
                  <span className="text-[10px] text-gray-400 font-medium pl-1">{postBatch.length} itens salvos</span>
                  <button
                    onClick={handleFinalizeBatch}
                    disabled={isShortening}
                    className="flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200 bg-green-600 text-white hover:bg-green-700 hover:-translate-y-0.5"
                  >
                    <Send size={14} /> ENVIAR LISTA ({postBatch.length})
                  </button>
                </div>
              )}
            </div>
            {copySuccess && <div className="text-center text-xs text-green-600 font-bold">{copySuccess}</div>}
          </div>
        </div>
      </div>

      {!showEditor && (
        <button
          onClick={() => setShowEditor(true)}
          className="md:hidden fixed top-4 right-4 z-50 bg-white p-3 rounded-full shadow-lg text-blue-600 border border-blue-100"
          aria-label="Abrir editor"
        >
          <Settings size={20} />
        </button>
      )}

      <div className="relative flex flex-col items-center md:items-start md:sticky md:top-8 shrink-0">
        <div className="relative w-[320px] md:w-[360px] bg-white rounded-[45px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden border-[10px] border-gray-900 h-[720px] flex flex-col select-none ring-1 ring-black/5">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[24px] bg-black rounded-b-[16px] z-30"></div>
          <div className="h-10 flex shrink-0 justify-between items-end px-6 pb-2 bg-white z-20">
            <span className="text-[10px] font-bold pl-1 text-slate-900">12:00</span>
            <div className="flex gap-1 pr-1 items-center">
              <div className="w-4 h-2.5 bg-slate-900 rounded-[2px] opacity-20"></div>
              <div className="w-0.5 h-1.5 bg-slate-900 opacity-20"></div>
            </div>
          </div>

          {platform === "instagram" && (
            <div className="flex shrink-0 items-center justify-between px-4 py-3 border-b border-gray-50 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                  <div className="w-full h-full bg-white rounded-full p-[2px]">
                    <img
                      src="https://ui-avatars.com/api/?name=P&background=f1f5f9&color=64748b"
                      className="w-full h-full rounded-full"
                      alt="Avatar"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-none">preview.app</span>
                  <span className="text-[9px] text-gray-500">Sponsored</span>
                </div>
              </div>
              <Settings size={20} className="text-gray-800 rotate-90" />
            </div>
          )}

          {platform === "facebook" && (
            <div className="flex shrink-0 items-center justify-between px-4 py-3 bg-white z-10 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden">
                  <img
                    src="https://ui-avatars.com/api/?name=P&background=1877F2&color=fff"
                    className="w-full h-full"
                    alt="Avatar"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-none text-gray-900">Preview App</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] text-gray-500">Just now</span>
                    <div className="w-0.5 h-0.5 rounded-full bg-gray-400"></div>
                    <span className="text-[9px] text-gray-400">🌎</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 text-gray-500">
                <div className="w-1 h-1 rounded-full bg-gray-600 box-content px-0.5"></div>
              </div>
            </div>
          )}

          <div className="relative w-full aspect-square shrink-0 bg-slate-100 group flex items-center justify-center overflow-hidden">
            {postData.slides[currentSlide] && (
              <>
                {postData.slides[currentSlide].type === "image" ? (
                  <div className="w-full h-full relative overflow-hidden bg-slate-100">
                    <img
                      src={postData.slides[currentSlide].thumb || postData.slides[currentSlide].url}
                      className="absolute inset-0 w-full h-full object-cover blur-xl opacity-50 scale-110 z-0"
                      alt="Background Blur"
                      aria-hidden="true"
                    />
                    <img
                      src={postData.slides[currentSlide].thumb || postData.slides[currentSlide].url}
                      className="relative w-full h-full object-contain z-10"
                      alt={`Slide ${currentSlide}`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/600x600/f1f5f9/94a3b8?text=Sem+Imagem";
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className="relative w-full h-full group cursor-pointer bg-black flex items-center justify-center"
                    onClick={() => window.open(postData.slides[currentSlide].url, "_blank")}
                  >
                    {postData.slides[currentSlide].thumb && (
                      <img
                        src={postData.slides[currentSlide].thumb}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 z-0"
                        alt="Video Thumb"
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 group-hover:scale-110 transition-transform">
                        <Play size={24} className="fill-white text-white ml-1" />
                      </div>
                      <span className="text-[10px] text-white/80 font-medium bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
                        Link de Vídeo
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {!postData.slides[currentSlide] && (
              <div className="text-slate-300 text-xs font-medium">Visualização da Mídia</div>
            )}

            {postData.slides.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentSlide((curr) => (curr === 0 ? postData.slides.length - 1 : curr - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full text-gray-800 shadow-sm hover:bg-white transition-all z-20"
                  aria-label="Slide anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentSlide((curr) => (curr === postData.slides.length - 1 ? 0 : curr + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full text-gray-800 shadow-sm hover:bg-white transition-all z-20"
                  aria-label="Próximo slide"
                >
                  <ChevronRight size={16} />
                </button>

                <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md font-medium z-20 border border-white/10 shadow-sm">
                  {currentSlide + 1}/{postData.slides.length}
                </div>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none">
                  {postData.slides.map((_, i) => (
                    <div
                      key={i}
                      className={`transition-all rounded-full shadow-sm ${
                        i === currentSlide ? "bg-white w-2 h-2 scale-110" : "bg-white/50 w-1.5 h-1.5"
                      }`}
                    ></div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-white scrollbar-hide pb-12">
            {platform === "instagram" ? (
              <div className="p-3">
                <div className="flex justify-between mb-3">
                  <div className="flex gap-4 text-slate-800">
                    <Heart size={24} strokeWidth={1.5} className="hover:text-slate-500 cursor-pointer" />
                    <MessageCircle size={24} strokeWidth={1.5} className="hover:text-slate-500 cursor-pointer" />
                    <Send size={24} strokeWidth={1.5} className="hover:text-slate-500 cursor-pointer" />
                  </div>
                  <Bookmark size={24} strokeWidth={1.5} className="text-slate-800 hover:text-slate-500 cursor-pointer" />
                </div>
                <div className="text-xs font-bold mb-1.5 text-slate-900">Curtido por você e outros</div>
                <p className="text-sm leading-relaxed text-slate-800">
                  <span className="font-bold mr-1">preview.app</span>
                  {postData.caption}
                </p>
                <div className="mt-2 text-[10px] text-gray-400 uppercase tracking-wide">HÁ 2 HORAS</div>
              </div>
            ) : (
              <div className="pb-4">
                <div className="flex justify-between px-8 py-3 border-b border-gray-100 mb-2 text-gray-500 text-xs font-medium bg-white">
                  <div className="flex gap-2 items-center">
                    <ThumbsUp size={18} /> Curtir
                  </div>
                  <div className="flex gap-2 items-center">
                    <MessageCircle size={18} /> Comentar
                  </div>
                  <div className="flex gap-2 items-center">
                    <Share2 size={18} /> Compartilhar
                  </div>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed px-4 pb-4">{postData.caption}</p>
              </div>
            )}
          </div>

          {!showEditor && !showFeedbackModal && window.innerWidth < 768 && (
            <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur border-t border-gray-100 p-3 flex gap-2 z-40">
              <button
                className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold"
                onClick={() => setShowFeedbackModal(true)}
              >
                AJUSTAR
              </button>
              <button className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold" onClick={handleApprove}>
                APROVAR
              </button>
            </div>
          )}
        </div>

        {!showEditor && (
          <div className="hidden md:flex w-full mt-4 gap-3">
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="flex-1 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-xs hover:bg-red-50 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <MessageSquare size={16} /> PEDIR AJUSTE
            </button>
            <button
              onClick={handleApprove}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 transition-all shadow-md shadow-green-200 flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              <CheckCircle size={16} /> APROVAR
            </button>
          </div>
        )}
      </div>

      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl scale-in-95 border border-gray-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-gray-800">O que precisa ajustar?</h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>
            </div>
            <textarea
              className="w-full border border-gray-300 rounded-xl p-4 text-sm h-36 outline-none resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-gray-300"
              placeholder="Descreva aqui as alterações..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              autoFocus
            />
            <button
              onClick={sendFeedbackToWhatsapp}
              className="w-full mt-5 py-3.5 bg-green-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-200 hover:-translate-y-0.5"
            >
              <Send size={18} /> Enviar Feedback no WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return <SocialMediaPreview />;
}
