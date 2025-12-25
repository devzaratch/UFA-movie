import requests
from bs4 import BeautifulSoup
import json

def scrape_movies():
    # ลองเปลี่ยนไปดึงหน้าหมวดหมู่โดยตรง
    url = "https://www.037-hddmovie.com/category/movie-hd/"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.google.com/'
    }
    
    try:
        session = requests.Session()
        response = session.get(url, headers=headers, timeout=20)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        new_data = []
        # วิธีใหม่: ค้นหาจากทุกลิงก์ที่มีคำว่า 'movie' และมีรูปภาพอยู่ข้างใน
        all_links = soup.find_all('a')
        
        for link in all_links:
            img = link.find('img')
            href = link.get('href', '')
            
            # กรองเฉพาะลิงก์ที่มีรูปและเป็นลิงก์หนังจริงๆ
            if img and '/movie/' in href and len(new_data) < 30:
                title = img.get('alt', '').strip() or link.get('title', '').strip()
                if not title: continue
                
                poster = img.get('src', '')
                if poster.startswith('//'): poster = 'https:' + poster

                # ป้องกันข้อมูลซ้ำ
                if not any(d['title'] == title for d in new_data):
                    new_data.append({
                        "id": f"m{len(new_data)+1}",
                        "title": title,
                        "poster": poster,
                        "url": href,
                        "category": "หนังใหม่",
                        "quality": "HD",
                        "type": "movie"
                    })
                    print(f"เจอหนังแล้ว: {title}")

        if not new_data:
            print("ยังไม่เจอหนัง ลองเปลี่ยนวิธีค้นหาแบบสำรอง...")
            # ถ้ายังไม่เจอ ให้ดึงจากทุกลิงก์ที่มีคำว่า ดูหนัง
            for a in soup.find_all('a', title=True):
                if 'ดูหนัง' in a['title'] and len(new_data) < 30:
                    new_data.append({
                        "id": f"m{len(new_data)+1}",
                        "title": a['title'],
                        "poster": "",
                        "url": a['href'],
                        "category": "หนังใหม่",
                        "quality": "HD",
                        "type": "movie"
                    })

        # บันทึกไฟล์
        with open('data.js', 'w', encoding='utf-8') as f:
            f.write(f"const movieDatabase = {json.dumps(new_data, ensure_ascii=False, indent=2)};")
        
        print(f"สำเร็จ! ดึงมาได้ {len(new_data)} เรื่อง")

    except Exception as e:
        print(f"พังตรงนี้: {e}")

if __name__ == "__main__":
    scrape_movies()
