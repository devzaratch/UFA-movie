'use client';

// White pill search box; dispatches the dm:search event that HomeGrid listens to.
export default function SearchBox() {
    const onSearch = (e) => {
        window.dispatchEvent(new CustomEvent('dm:search', { detail: e.target.value }));
    };

    return (
        <form className="search-box" onSubmit={(e) => e.preventDefault()}>
            <input
                type="text"
                id="search"
                placeholder="พิมพ์ชื่อหนัง... ຄົ້ນຫາໜັງ"
                onInput={onSearch}
            />
            <button type="submit" className="search-btn" aria-label="ค้นหา">
                <i className="fas fa-search"></i>
            </button>
        </form>
    );
}
