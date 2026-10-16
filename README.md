# Coming soon — Vercel + Telegram

Sayfada yalnızca İngilizce açılış mesajı bulunur. Her sayfa yüklemesi bir ziyaret sayılır; yenilemek de yeni ziyarettir. Telegram'a toplam ziyaret, tekil tarayıcı, tekrar ziyaret sayısı, anonim kimlik, yaklaşık şehir/ülke, kaynak alan adı, UTM, cihaz, tarayıcı, dil ve İstanbul saati gönderilir.

## Ücretsiz kurulum

1. Bu klasörün içeriğini kendi GitHub repona yükle. Vercel'de repoyu içe aktar; Framework: **Next.js**. Root Directory bu klasör olmalı.
2. Upstash hesabında **Redis / Free** veritabanı oluştur. Ücretli plan seçme. REST URL ve REST TOKEN değerlerini al. Vercel Marketplace üzerinden Upstash bağlamak da mümkün; aşağıdaki değişken adlarının aynı olduğundan emin ol.
3. Vercel → Project → Settings → Environment Variables bölümüne ekle:

| Değişken | Değer |
|---|---|
| TELEGRAM_BOT_TOKEN | BotFather'dan aldığın bot anahtarı |
| TELEGRAM_CHAT_ID | Kendi Telegram chat ID değerin |
| UPSTASH_REDIS_REST_URL | Redis veritabanının REST URL değeri |
| UPSTASH_REDIS_REST_TOKEN | Redis veritabanının yazma yetkili REST TOKEN değeri |

Anahtarları Production ortamına ekle. Preview bildirimleri istemiyorsan Preview ortamına ekleme. Gizli değerlerin adını NEXT_PUBLIC_ ile başlatma. Bot anahtarı sohbette paylaşıldı; BotFather'da yenileyip yeni değeri kullan. Anahtar proje dosyalarında bulunmaz.

4. Deploy / Redeploy yap. Botu Telegram'da açıp `/start` göndermiş olmalısın.
5. Canlı siteyi aç: Telegram'a ilk bildirim gelmeli. Aynı tarayıcıda yenile: “Tekrar gelen” ve toplam sayı artmalı. Gizli pencerede aç: tekil tarayıcı sayısı artmalı.
6. Kaynak ölçmek için linklerini etiketle: `https://SITEN.vercel.app/?utm_source=instagram&utm_medium=bio&utm_campaign=launch`. Örneğin Telegram paylaşımı için `utm_source=telegram` kullan.

Vercel Hobby kişisel/ticari olmayan kullanım içindir. Upstash Free kotası sınırlıdır; ücretsiz planları kullan ve ücretli plana geçme. Güncel koşullar: https://vercel.com/pricing ve https://upstash.com/pricing/redis . Özel alan adı gerekmez, Vercel'in ücretsiz adresi yeterli.

## Yerel çalışma

Node.js 22+ ile `npm ci`, ardından `.env.example` dosyasını `.env.local` olarak kopyala, değerleri doldur ve `npm run dev` çalıştır. Üretim kontrolü: `npm run build`.

## Ölçüm sınırları

- Kişi kimliği değil, imzalı birinci taraf çereziyle tarayıcı ölçülür. Çerez silinirse veya başka cihaz kullanılırsa yeni ziyaretçi sayılır. Ham IP saklanmaz/gönderilmez. Çerez bir yıl geçerlidir.
- Şehir/ülke Vercel'in IP tabanlı başlıklarından gelir; GPS konumu değildir. VPN ve operatörler sonucu değiştirebilir. Yerelde bilinmiyor görünür.
- Referer bazen uygulama/tarayıcı tarafından gizlenir. Hangi paylaşımın tıklandığını ayırmak için UTM kullan. Tam yönlendiren URL'nin yalnızca alan adı gönderilir.
- JavaScript kapalıysa veya istek engellenirse ziyaret sayılmaz. Yaygın botlar filtrelenir; bu eksiksiz bot tespiti değildir.
- Aynı IP'den dakikada 60 takip isteği sınırı vardır. Tekrarlanan event ID 24 saat içinde tekrar sayılmaz. Sayaçlar Redis'te atomik güncellenir; deploy sırasında sıfırlanmaz. Redis silinirse/veri kaybolursa sayaçlar da kaybolur.
- Telegram veya Redis kesintisinde bildirim garanti değildir. Kalıcı bildirim kuyruğu yoktur; Telegram hatasında sayaç artmış olabilir. Vercel Functions logları hata durumunu gösterir, gizli değerleri yazdırmaz.
- Bu bildirimler sayfa açılışlarını gösterir; aynı anda açık sekme veya anlık çevrimiçi kişi sayısını göstermez.
- Ziyaretçi bilgilendirmesi ve gerekiyorsa çerez izni, sitenin kullanım yerine göre ayrıca düzenlenmelidir.
