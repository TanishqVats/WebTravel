class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        // 1A)FILTERING
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(element => delete queryObj[element]);


        // 1B)ADVANCE FILTERING
        let queryString = JSON.stringify(queryObj);
        queryString = queryString.replace(/\b(gte|gte|lt|lte)\b/g, match => `$${match}`);
        // console.log(JSON.parse(queryString));

        // let query = Tour.find(JSON.parse(queryString));
        this.query.find(JSON.parse(queryString));

        return this;
    }

    sort() {
        // 2)SORTING
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy)
        } else {
            this.query = this.query.sort('-createdAt')
        }

        return this;
    }

    limitFields() {
        // 3)FIELD LIMITING
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            // query = query.select('name duration price')
            this.query = this.query.select(fields);
        } else {
            this.query.select('-__v')
        }

        return this;
    }

    paginate() {
        // 4) Pagination
        const page = this.queryString.page * 1;
        const limit = this.queryString.limit * 1;
        const skip = (page - 1) * limit;

        // page=2&limit=10; 1-10(page:1), 11-20(page:2), 21-30(page:3)
        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;