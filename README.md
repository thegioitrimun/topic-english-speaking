# 🎙️ 30 Chủ Đề Hùng Biện Tiếng Anh (Foundation of Public Speaking - TVU)

Dự án website học tập và luyện tập 30 bài thuyết trình tiếng Anh cơ bản theo chuẩn khung chương trình **Foundation of Public Speaking** - Trường Đại học Trà Vinh (TVU).

- **Trang web trực tiếp (Live Demo):** [https://thegioitrimun.github.io/topic-english-speaking/](https://thegioitrimun.github.io/topic-english-speaking/)
- **Repository:** [https://github.com/thegioitrimun/topic-english-speaking](https://github.com/thegioitrimun/topic-english-speaking)

---

## 📋 Mục Lục

1. [Tổng Quan Tính Năng](#-tổng-quan-tính-năng)
2. [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
3. [Hướng Dẫn Chạy Cục Bộ (Local Development)](#-hướng-dẫn-chạy-cục-bộ-local-development)
4. [Hướng Dẫn Build & Tạo Dữ Liệu (Data & Audio Build)](#-hướng-dẫn-build--tạo-dữ-liệu-data--audio-build)
5. [Hướng Dẫn Deploy Lên GitHub Pages](#-hướng-dẫn-deploy-lên-github-pages)
6. [Deploy Lên Các Nền Tảng Khác (Vercel, Netlify)](#-deploy-lên-các-nền-tảng-khác)

---

## ✨ Tổng Quan Tính Năng

- **30 Chủ Đề Chuẩn TVU:** Đầy đủ Mở bài (4 bước), Thân bài (2 luận điểm), Kết bài (3 yếu tố), kèm bản dịch tiếng Việt song hành.
- **Sticky Audio & Navigation Bar:** Thanh phát âm Audio AI và thanh chuyển Tab (🎙️ Bài Nói, 📑 Dàn Ý, 🇻🇳 Bản Dịch, 💡 Từ Vựng, 🎯 Mẹo) luôn ghim cố định ở đầu màn hình khi cuộn bài viết.
- **Phát Âm Studio Kokoro AI (24kHz):** Giọng đọc bản ngữ tự nhiên, tích hợp tùy chọn tốc độ đọc (0.85x, 1.0x, 1.15x) và tính năng sao chép, in ấn / PDF.
- **Tra Cứu Phiên Âm IPA & Nghĩa Tức Thì:** Di chuột (hover trên Desktop) hoặc chạm (Tap trên Mobile/iPad) vào bất kỳ từ vựng nào để xem phiên âm quốc tế IPA và nghĩa tiếng Việt.
- **Bút Dạ Quang & Sổ Tay Từ Chưa Nhớ (Word Bank):** Bật chế độ "Bút Dạ Quang" để đánh dấu các từ khó nhớ; hệ thống tự động lưu vào Sổ tay từ vựng (Word Bank Drawer) bằng LocalStorage.
- **Đồng Hồ Bấm Giờ Luyện Nói:** Đồng hồ đếm ngược với các mốc thi chuẩn (2 phút, 3 phút, 5 phút).
- **Giao Diện Hiện Đại (Apple HIG & Glassmorphism):** Hỗ trợ Dark Mode / Light Mode, tối ưu cảm ứng cho iPad, iPhone và máy tính.

---

## 📂 Cấu Trúc Thư Mục

```text
topic-english-speaking/
├── index.html            # Trang giao diện chính (Semantic HTML5, Accessible)
├── style.css             # Toàn bộ CSS giao diện, Dark/Light theme, Responsive
├── app.js                # Logic ứng dụng (Audio player, Sticky tabs, Highlight, Word Bank)
├── topics-data.js        # Dữ liệu 30 chủ đề (Dàn ý, bài nói, bản dịch, từ vựng)
├── phonetics-data.js     # Từ điển phiên âm IPA và nghĩa của toàn bộ từ vựng
│
├── audio/                # Thư mục chứa 30 file âm thanh MP3 (topic-1.mp3 -> topic-30.mp3)
│   ├── topic-1.mp3
│   ├── ...
│   └── topic-30.mp3
│
├── gen_topics_1_10.py    # Dữ liệu nguồn chủ đề 1 - 10
├── gen_topics_11_20.py   # Dữ liệu nguồn chủ đề 11 - 20
├── gen_topics_21_30.py   # Dữ liệu nguồn chủ đề 21 - 30
├── combine_topics.py     # Script tổng hợp dữ liệu thành topics-data.js
├── build_phonetics.py    # Script trích xuất và sinh từ điển IPA (phonetics-data.js)
├── generate_audio.py     # Script gọi Kokoro TTS để xuất file MP3 chất lượng cao
└── .gitignore            # Loại trừ cache và file tạm
```

---

## 💻 Hướng Dẫn Chạy Cục Bộ (Local Development)

Dự án được xây dựng theo chuẩn **Vanilla Web (HTML5/CSS3/ES6)**, không yêu cầu bước biên dịch (no build step) để chạy giao diện.

### Cách 1: Sử dụng Python HTTP Server (Nhanh nhất)

Mở Terminal tại thư mục dự án và chạy:

```bash
# Chạy máy chủ HTTP nội bộ tại port 8000
python3 -m http.server 8000
```

Mở trình duyệt truy cập: [http://localhost:8000](http://localhost:8000)

### Cách 2: Sử dụng Node.js (npx serve)

Nếu máy bạn đã cài Node.js / npm:

```bash
npx serve .
```

Hoặc:

```bash
npx http-server -p 8080
```

### Cách 3: Sử dụng Visual Studio Code Live Server

1. Cài đặt tiện ích **Live Server** (của Ritwick Dey) trong VS Code.
2. Nhấp chuột phải vào file [index.html](file:///Users/PHUC/Desktop/Topic%20English/index.html) chọn **"Open with Live Server"**.

---

## 🛠️ Hướng Dẫn Build & Tạo Dữ Liệu (Data & Audio Build)

### 1. Cập nhật nội dung các bài nói (Topics Data)

Khi bạn muốn chỉnh sửa nội dung bài nói, dàn ý, từ vựng:

1. Chỉnh sửa nội dung tương ứng trong các file nguồn:
   - [gen_topics_1_10.py](file:///Users/PHUC/Desktop/Topic%20English/gen_topics_1_10.py) (Topic 1 đến 10)
   - [gen_topics_11_20.py](file:///Users/PHUC/Desktop/Topic%20English/gen_topics_11_20.py) (Topic 11 đến 20)
   - [gen_topics_21_30.py](file:///Users/PHUC/Desktop/Topic%20English/gen_topics_21_30.py) (Topic 21 đến 30)
2. Chạy lệnh tổng hợp để cập nhật file [topics-data.js](file:///Users/PHUC/Desktop/Topic%20English/topics-data.js):
   ```bash
   python3 combine_topics.py
   ```

### 2. Sinh từ điển phiên âm IPA tự động (Phonetics)

Khi có từ vựng mới hoặc thay đổi bài nói, bạn có thể sinh lại toàn bộ phiên âm IPA tự động:

```bash
python3 build_phonetics.py
```
> Script sẽ quét qua toàn bộ 30 bài nói, trích xuất tất cả các từ đơn và sinh file [phonetics-data.js](file:///Users/PHUC/Desktop/Topic%20English/phonetics-data.js) kèm chuẩn phiên âm quốc tế.

### 3. Sinh lại file âm thanh giọng đọc (Audio Generation)

Dự án hỗ trợ sinh giọng đọc phòng thu AI (24kHz) bằng **Kokoro TTS**:

1. Khởi chạy Kokoro TTS Server cục bộ qua Docker:
   ```bash
   docker run -d -p 8880:8880 remsky/kokoro-fastapi:v0.1.0
   ```
2. Chạy script tạo âm thanh MP3:
   ```bash
   python3 generate_audio.py
   ```
   File MP3 hoàn chỉnh sẽ được lưu tự động vào thư mục [audio/](file:///Users/PHUC/Desktop/Topic%20English/audio).

---

## 🚀 Hướng Dẫn Deploy Lên GitHub Pages

Dự án đã được cấu hình tự động triển khai qua **GitHub Pages** từ nhánh `main`. Mỗi khi bạn đẩy (push) code mới lên GitHub, trang web sẽ tự động cập nhật trong vòng 30 - 60 giây.

### Quy trình 3 bước chuẩn:

```bash
# Bước 1: Kiểm tra các file đã thay đổi
git status

# Bước 2: Thêm các file thay đổi vào staging và tạo commit
git add .
git commit -m "Mô tả ngắn gọn tính năng vừa cập nhật"

# Bước 3: Đẩy lên GitHub (nhánh main)
git push origin main
```

### Cách kiểm tra trạng thái Deploy:

#### Cách 1: Qua GitHub CLI trên Terminal
```bash
# Xem trạng thái build mới nhất
gh api repos/thegioitrimun/topic-english-speaking/pages/builds/latest
```
Khi trường `"status"` chuyển thành `"built"`, bản cập nhật đã sẵn sàng trên trang web!

#### Cách 2: Qua giao diện GitHub Web
1. Truy cập: [https://github.com/thegioitrimun/topic-english-speaking/deployments](https://github.com/thegioitrimun/topic-english-speaking/deployments)
2. Xem mục **github-pages** để theo dõi trạng thái tích xanh (Active).

---

## 🌐 Deploy Lên Các Nền Tảng Khác

Vì website là ứng dụng tĩnh (Static Web App), bạn có thể dễ dàng deploy lên bất kỳ nền tảng nào:

### 1. Vercel
```bash
# Cài đặt Vercel CLI (nếu chưa có)
npm i -g vercel

# Deploy nhanh
vercel --prod
```

### 2. Netlify
```bash
# Cài đặt Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=.
```

### 3. Cloudflare Pages
- Kết nối kho mã nguồn GitHub `thegioitrimun/topic-english-speaking` vào **Cloudflare Pages Dashboard**.
- Framework preset: `None` / `HTML`.
- Build command: Để trống.
- Build output directory: `/`.

---

## 📞 Hỗ Trợ & Bản Quyền

- Dự án thuộc chương trình đào tạo Cử nhân Trực tuyến - **Trường Đại học Trà Vinh (TVU)**.
- Học phần: *Foundation of Public Speaking* (Hùng biện Tiếng Anh cơ bản).
