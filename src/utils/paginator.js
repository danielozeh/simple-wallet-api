const paginate = (page, limit, total) => {
    let min, max, prevPage, nextPage, totalPage = Math.ceil(total/limit)
    if (page === 1) {
        min = 0
        max = limit
        prevPage = null
        nextPage = page + 1
    } else {
        min = limit + ((page - 1) * limit)
        max = (limit + page) - 1
        prevPage = page - 1
        nextPage = page + 1
    }
    return {
        min, max, nextPage, prevPage, total, totalPage, page
    }
}

const build = (model) => {
    return {
        page: model.page,
        limit: model.limit,
        prevPage: model.prevPage,
        nextPage: model.nextPage,
        currentPage: model.currentPage,
        totalDocs: model.totalDocs,
        totalPages: model.totalPages,
        pagingCounter: model.pagingCounter,
        hasPrevPage: model.hasPrevPage,
        hasNextPage: model.hasNextPage
    }
}
module.exports = {paginate, build}